import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {GridObservable} from "../cache/GridObservable.web";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {LinkedGrid} from "../cache/LinkedGrid.web";
import {dateStr, dictKeysFromObject, dictSetFromArray} from "../DiagramUtil";
import {PrivateDiagramLookupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService";
import {DispBase, DispBaseT} from "../canvas-shapes/DispBase";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch";
import {PeekCanvasModelQuery} from "./PeekCanvasModelQuery.web";
import {PeekCanvasModelSelection} from "./PeekCanvasModelSelection.web";
import {PeekCanvasModelOverride} from "./PeekCanvasModelOverride.web";
import {
    OverrideUpdateDataI,
    PrivateDiagramOverrideService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramOverrideService";

// import 'rxjs/add/operator/takeUntil';

function now(): any {
    return new Date();
}


interface GridOrBranchI {
    disps: any[];
    key: string;
    isBranch: boolean;
}

/**
 * Peek Canvas Model
 *
 * This class stores and manages the model of the NodeCoord and ConnCoord
 * objects that are within the viewable area.
 *
 */

export class PeekCanvasModel {

    private _modelSetId = null;
    private _coordSetId = null;

    // Grid Buffer
    private _gridBuffer = {};

    // The grid keys  SET in the viewable area from the last check
    private _viewingGridKeysDict = {};

    // The grid keys STRING in the viewable area from the last check
    private _viewingGridKeysStr: string = "";

    // Objects to be drawn on the display
    private _visibleDisps = [];

    // Does the model need an update?
    private needsUpdate = false;

    // Does the display array need recompiling?
    private needsCompiling = false;

    // Is the model currently updating
    private isUpdating = false;

    private readonly _query: PeekCanvasModelQuery;
    private readonly _selection: PeekCanvasModelSelection;
    private readonly _override: PeekCanvasModelOverride;

    constructor(private config: PeekCanvasConfig,
                private gridObservable: GridObservable,
                private lookupCache: PrivateDiagramLookupService,
                private branchService: PrivateDiagramBranchService,
                private overrideService: PrivateDiagramOverrideService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter) {
        this._query = new PeekCanvasModelQuery(this);
        this._selection = new PeekCanvasModelSelection(this, this.config);
        this._override = new PeekCanvasModelOverride(config, lookupCache);

        this.needsUpdate = false;

        // Start the gridKey checker timer.
        setInterval(() => this._checkGridKeysForArea(),
            this.config.controller.updateInterval);

        // Start the draw timer.
        setInterval(() => this._compileDisps(),
            this.config.controller.updateInterval);

        // Subscribe to grid updates, when the data store gets and update
        // from the server, we will

        this.gridObservable.observableForCanvas(this.config.canvasId)
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe((grid: LinkedGrid) => this._receiveGrid([grid]));

        this.lifecycleEventEmitter.onDestroyEvent
            .subscribe(() => this.gridObservable.unsubscribeCanvas(this.config.canvasId));

        // Hook up the trigger to recompile the model
        this.config.model.needsCompiling
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => this.needsCompiling = true);

        // Watch for changes to the config that effect us
        this.config.controller.coordSetChange
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe((coordSet) => {
                if (coordSet == null) {
                    this._modelSetId = null;
                    this._coordSetId = null;

                } else {
                    this._modelSetId = coordSet.modelSetId;
                    this._coordSetId = coordSet.id;
                }

                this.reset();
                this.selection.reset();
                this.needsUpdate = true;
            });

        // Watch the canvas settings, if they change then request and update from
        // the cache
        this.config.viewPort.windowChange
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => this.needsUpdate = true);

        // Watch the overrides, if the overrides change, then
        this.overrideService
            .overridesUpdatedObservable
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe((data: OverrideUpdateDataI) => {
                this._override.setOverrides(data.overrides);
                this.needsCompiling = true;
                if (data.overridesRemoved) {
                    // Force the updates to load when they come back
                    for (const gridKey of Object.keys(this._gridBuffer)) {
                        this._gridBuffer[gridKey].lastUpdate = null;
                    }
                    // Flush the cache and reload the grid keys
                    this.gridObservable.updateDiagramWatchedGrids(
                        this.config.canvasId,
                        Object.keys(this._viewingGridKeysDict),
                        true
                    );
                }
            });

    };

// -------------------------------------------------------------------------------------
// reset
// -------------------------------------------------------------------------------------
    private reset() {
        this.needsUpdate = false;
        this.isUpdating = false;

        this._visibleDisps = []; // Objects to be drawn on the display
        this._gridBuffer = {}; // Store grids from the server by gridKey.

        this._viewingGridKeysDict = {};
        this._viewingGridKeysStr = "";
    };


// -------------------------------------------------------------------------------------
// Request Display Updates
// -------------------------------------------------------------------------------------
    private _checkGridKeysForArea() {
        if (this._coordSetId == null)
            return;

        if (!this.needsUpdate)
            return;

        this.needsUpdate = false;

        if (!this.lookupCache.isReady())
            return;

        let area = this.config.viewPort.window;
        let zoom = this.config.viewPort.zoom;

        let viewingGridKeys = this.config.controller.coordSet.gridKeysForArea(area, zoom);

        // If there is no change, then do nothing
        // Should these be sorted?
        if (viewingGridKeys.join() == this._viewingGridKeysStr)
            return;

        this._viewingGridKeysStr = viewingGridKeys.join();
        this._viewingGridKeysDict = dictSetFromArray(viewingGridKeys);

        // Remove grids we're no longer looking at.
        for (let gridKey of dictKeysFromObject(this._gridBuffer)) {
            if (!this._viewingGridKeysDict.hasOwnProperty(gridKey)) {
                delete this._gridBuffer[gridKey];
            }
        }

        // Notify the grid manager that the view has changed
        this.gridObservable.updateDiagramWatchedGrids(
            this.config.canvasId, viewingGridKeys
        );
    }


// -------------------------------------------------------------------------------------
// Process Display Updates
// -------------------------------------------------------------------------------------
    /** Receive Grid
     *
     * NOTE: The grid data is not received in order,
     * and sometimes the ModelGrids don't have data when no
     * update from the server is requird.
     *
     * @param linkedGrids: A list of grids from the GridObservable
     * @private
     */
    private _receiveGrid(linkedGrids: LinkedGrid[]) {

        // Overwrite with all the new ones
        for (let linkedGrid of linkedGrids) {
            console.log(`PeekCanvasModel: Received grid ${linkedGrid.gridKey},  ${linkedGrid.lastUpdate}`);

            if (!linkedGrid.hasData())
                continue;

            // If we're not viewing this grid any more, discard the data.
            if (this._viewingGridKeysDict[linkedGrid.gridKey] == null)
                continue;

            // If it's not an update, also ignore it.
            let currentGrid = this._gridBuffer[linkedGrid.gridKey];
            if (currentGrid != null && currentGrid.lastUpdate == linkedGrid.lastUpdate)
                continue;

            console.log(`PeekCanvasModel: Applying grid ${linkedGrid.gridKey},  ${linkedGrid.lastUpdate}`);
            this._gridBuffer[linkedGrid.gridKey] = linkedGrid;
            this.needsCompiling = true;
        }

    }


// -------------------------------------------------------------------------------------
// Display Items
// -------------------------------------------------------------------------------------

    get query(): PeekCanvasModelQuery {
        return this._query;
    }

    get selection(): PeekCanvasModelSelection {
        return this._selection;
    }

    viewableDisps() {
        return this._visibleDisps;
    }

    protected _compileDisps(force = false) {
        if (!this.needsCompiling && !force)
            return;

        this.needsCompiling = false;

        if (this._modelSetId == null || this._coordSetId == null)
            return;

        let startTime = now();

        let levelsOrderedByOrder = this.lookupCache.levelsOrderedByOrder(this._coordSetId);
        let layersOrderedByOrder = this.lookupCache.layersOrderedByOrder(this._modelSetId);

        let dispIndexByGridKey = {};

        let disps = [];
        let dispHashIdsAdded = {};
        let branchIdsActive = {};

        for (let id of this.branchService.getVisibleBranchIds(this._coordSetId)) {
            branchIdsActive[id] = true;
        }

        // Get the grids we're going to compile
        let gridsOrBranchesToCompile: GridOrBranchI[] = [];
        for (let gridKey of Object.keys(this._viewingGridKeysDict)) {
            let grid = this._gridBuffer[gridKey];

            if (grid == null)
                continue;

            gridsOrBranchesToCompile.push({
                key: grid.gridKey,
                disps: grid.disps,
                isBranch: false
            });
        }

        // Include the active branch
        let isEditorActive = this.config.editor.active;
        let activeBranch = this.config.editor.activeBranchTuple;
        if (activeBranch != null) {
            for (let branchDisp of activeBranch.disps)
                dispHashIdsAdded[DispBase.replacesHashId(branchDisp)] = true;

            // Make sure it's not showing when we edit the branch
            delete branchIdsActive[activeBranch.id];

            gridsOrBranchesToCompile.push({
                key: activeBranch.key,
                disps: activeBranch.disps,
                isBranch: true
            });
        }

        // For all the disps we're going to add,
        // Add all the replacesHashId so that the disps being replaced don't show.
        for (let gridOrBranch of gridsOrBranchesToCompile) {
            for (let disp of gridOrBranch.disps) {
                // TODO Restrict for Branch Stage
                // If the branch is showing, and it replaces a hash,
                // then add the hash it replaces
                let replacesHashId = DispBase.replacesHashId(disp);
                if (branchIdsActive[disp.bi] == true && replacesHashId != null) {
                    dispHashIdsAdded[replacesHashId] = true;
                }
            }
        }


        for (const level of levelsOrderedByOrder) {
            for (const layer of layersOrderedByOrder) {


                // If it's not visible (enabled), continue
                if (!layer.visible && !isEditorActive)
                    continue;

                for (let gridOrBranch of gridsOrBranchesToCompile) {
                    let gridOrBranchDisps = gridOrBranch.disps;

                    // If this is the first iteration, initialise to 0
                    let nextIndex = dispIndexByGridKey[gridOrBranch.key];
                    if (nextIndex == null)
                        nextIndex = 0;

                    // If we've processed all the disps in this grid, continue to next
                    if (nextIndex >= gridOrBranchDisps.length)
                        continue;

                    for (; nextIndex < gridOrBranchDisps.length; nextIndex++) {
                        let disp = gridOrBranchDisps[nextIndex];

                        // Level first, as per the sortDisps function
                        let dispLevel = DispBase.level(disp);
                        if (dispLevel.order < level.order)
                            continue;

                        if (level.order < dispLevel.order)
                            break;

                        // Then Layer
                        let dispLayer = DispBase.layer(disp);
                        if (dispLayer.order < layer.order)
                            continue;

                        if (layer.order < dispLayer.order)
                            break;

                        // If the disp has already been added or is being replaced
                        // by a branch, then skip this one
                        if (dispHashIdsAdded[DispBase.hashId(disp)] === true)
                            continue;

                        // Is the branch showed from the "View Branches" menu
                        let isBranchViewable = branchIdsActive[disp.bi] === true;

                        // If this is not apart of a branch, or ...
                        if (disp.bi == null || isBranchViewable || gridOrBranch.isBranch) {
                            disps.push(disp);
                            dispHashIdsAdded[DispBase.hashId(disp)] = true;
                        }

                    }

                    dispIndexByGridKey[gridOrBranch.key] = nextIndex;
                }
            }
        }

        this._override.applyOverridesToModel(disps);


        this._visibleDisps = disps;
        this.selection.applyTryToSelect();
        this.config.model.dispOnScreen = disps.length;
        this.config.invalidate();

        let timeTaken = now() - startTime;

        console.log(`${dateStr()} Model: compileDisps took ${timeTaken}ms`
            + ` for ${disps.length} disps`
            + ` and ${gridsOrBranchesToCompile.length} grids/branches`);
    }

    recompileModel(): void {
        this._compileDisps(true);
    }

    /** Sort Disps
     *
     * This method sorts disps in the order needed for the model to compile them for the
     * renderer.
     *
     * This method was initially written for the BranchTuple.
     *
     * WARNING: Sorting disps is terrible for performance, this is only used while
     * the branch is being edited by the user.
     *
     * @param disps: A List of disps to sort
     * @returns: A list of sorted disps
     */
    static sortDisps(disps: DispBaseT[]): DispBaseT[] {
        function cmp(d1: DispBaseT, d2: DispBaseT): number {

            let levelDiff = DispBase.level(d1).order - DispBase.level(d2).order;
            if (levelDiff != 0)
                return levelDiff;

            let layerDiff = DispBase.layer(d1).order - DispBase.layer(d2).order;
            if (layerDiff != 0)
                return layerDiff;

            return DispBase.zOrder(d1) - DispBase.zOrder(d2);
        }

        return disps.sort(cmp);

    }

}