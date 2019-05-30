import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {GridObservable} from "../cache/GridObservable.web";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {LinkedGrid} from "../cache/LinkedGrid.web";
import {dateStr, dictKeysFromObject, dictSetFromArray} from "../DiagramUtil";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {DispBase} from "../tuples/shapes/DispBase";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch";
import {PeekCanvasModelQuery} from "./PeekCanvasModelQuery.web";
import {PeekCanvasModelSelection} from "./PeekCanvasModelSelection.web";

// import 'rxjs/add/operator/takeUntil';

function now(): any {
    return new Date();
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
    private _visableDisps = [];
    private _gridDisps = [];

    // Does the model need an update?
    private needsUpdate = false;

    // Does the display array need recompiling?
    private needsCompiling = false;

    // Is the model currently updating
    private isUpdating = false;

    private _query: PeekCanvasModelQuery;
    private _selection: PeekCanvasModelSelection;

    constructor(private config: PeekCanvasConfig,
                private gridObservable: GridObservable,
                private lookupCache: DiagramLookupService,
                private branchService: PrivateDiagramBranchService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter) {
        this._query = new PeekCanvasModelQuery(this);
        this._selection = new PeekCanvasModelSelection(this, this.config);

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
                    this.config.updateViewPortPan({x: 0, y: 0});
                    this.config.updateViewPortZoom(1.0);
                    this._modelSetId = null;
                    this._coordSetId = null;

                } else {
                    this.config.updateViewPortPan(
                        {x: coordSet.initialPanX, y: coordSet.initialPanY}
                    );
                    this.config.updateViewPortZoom(coordSet.initialZoom);
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


    };

// -------------------------------------------------------------------------------------
// reset
// -------------------------------------------------------------------------------------
    private reset() {
        this.needsUpdate = false;
        this.isUpdating = false;

        this._visableDisps = []; // Objects to be drawn on the display
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
            if (!this._viewingGridKeysDict.hasOwnProperty(linkedGrid.gridKey))
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
        return this._visableDisps;
    }


    private _compileDisps(force = false) {
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

        let activeBranch = this.config.editor.activeBranchTuple;
        if (activeBranch != null) {
            for (let branchDisp of activeBranch.disps)
                dispHashIdsAdded[DispBase.hashId(branchDisp)] = true;

            // Make sure it's not showing when we edit the branch
            delete branchIdsActive[activeBranch.id];
        }

        let viewableGrids = dictKeysFromObject(this._viewingGridKeysDict);

        for (let levelIndex = 0; levelIndex < levelsOrderedByOrder.length; levelIndex++) {
            let level: DispLevel = <DispLevel>levelsOrderedByOrder[levelIndex];


            for (let layerIndex = 0; layerIndex < layersOrderedByOrder.length; layerIndex++) {
                let layer: DispLayer = <DispLayer>layersOrderedByOrder[layerIndex];

                // If it's not visible (enabled), continue
                if (!layer.visible)
                    continue;

                for (let gridKey of viewableGrids) {
                    let grid = this._gridBuffer[gridKey];

                    if (grid == null)
                        continue;

                    // If this is the first iteration, initialise to 0
                    let nextIndex = dispIndexByGridKey[gridKey];
                    if (nextIndex == null)
                        nextIndex = 0;

                    // If we've processed all the disps in this grid, continue to next
                    if (nextIndex >= grid.disps.length)
                        continue;

                    for (; nextIndex < grid.disps.length; nextIndex++) {
                        let disp = grid.disps[nextIndex];

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

                        // BranchId
                        if (disp.bi == null || branchIdsActive[disp.bi] == true)
                            disps.push(disp);

                        dispHashIdsAdded[DispBase.hashId(disp)] = true;
                    }

                    dispIndexByGridKey[gridKey] = nextIndex;
                }
            }
        }

        this._gridDisps = disps.slice();

        this.compileBranchDisps();

        let timeTaken = now() - startTime;

        console.log(`${dateStr()} Model: compileDisps took ${timeTaken}ms`
            + ` for ${disps.length} disps and ${viewableGrids.length} grids`);
    }

    recompileModel(): void {
        this._compileDisps(true);
    }

    compileBranchDisps(): void {
        let disps = this._gridDisps.slice();

        let activeBranch = this.config.editor.activeBranchTuple;
        if (activeBranch != null) {
            Array.prototype.push.apply(disps, activeBranch.disps);
        }

        this._visableDisps = disps;
        this.selection.applyTryToSelect();
        this.config.model.dispOnScreen = disps.length;
        this.config.invalidate();
    }


}