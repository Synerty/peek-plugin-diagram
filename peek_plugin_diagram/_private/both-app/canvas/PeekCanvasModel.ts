import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {GridObservable} from "../cache/GridObservable";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {LinkedGrid} from "../cache/LinkedGrid";
import {dateStr, dictKeysFromObject, dictSetFromArray} from "../DiagramUtil";
import {gridKeysForArea} from "../cache/GridKeyUtil";
import {LookupCache} from "../cache/LookupCache";
import {DispFactory, DispType} from "../tuples/shapes/DispFactory";
import {DispLevel} from "../tuples/lookups/DispLevel";
import {DispLayer} from "../tuples/lookups/DispLayer";
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

    _coordSetId = null;

    // Grid Buffer
    _gridBuffer = {};

    // The grid keys  SET in the viewable area from the last check
    _viewingGridKeysDict = {};

    // The grid keys STRING in the viewable area from the last check
    _viewingGridKeysStr: string = "";

    // Objects to be drawn on the display
    _visableDisps = [];

    // The currently selected coords
    _selection = [];

    // Does the model need an update?
    needsUpdate = false;

    // Is the model currently updating
    isUpdating = false;

    constructor(private config: PeekCanvasConfig,
                private gridObservable: GridObservable,
                private lookupCache: LookupCache,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter) {

        this.needsUpdate = false;

        // Start the draw timer.
        setInterval(() => this._requestDispUpdate(),
            this.config.controller.updateInterval);

        // Subscribe to grid updates, when the data store gets and update
        // from the server, we will

        this.gridObservable.observableForCanvas(this.config.canvasId)
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe((grid: LinkedGrid) => this._receiveGrid([grid]));

        this.lifecycleEventEmitter.onDestroyEvent.subscribe(() => {
            this.gridObservable.unsubscribeCanvas(this.config.canvasId);
        });


        // Watch for changes to the config that effect us
        this.config.controller.coordSetChange
            .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
            .subscribe((coordSet) => {
                if (coordSet == null) {
                    this.config.updateViewPortPan({x: 0, y: 0});
                    this.config.updateViewPortZoom(1.0);
                    this._coordSetId = null;

                } else {
                    this.config.updateViewPortPan(
                        {x: coordSet.initialPanX, y: coordSet.initialPanY}
                    );
                    this.config.updateViewPortZoom(coordSet.initialZoom);
                    this._coordSetId = coordSet.id;
                }

                this.reset();
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
    reset() {
        this.needsUpdate = false;
        this.isUpdating = false;

        this._selection = []; // The currently selected coords

        this._visableDisps = []; // Objects to be drawn on the display
        this._gridBuffer = {}; // Store grids from the server by gridKey.

        this._viewingGridKeysDict = {};
        this._viewingGridKeysStr = "";
    };


// -------------------------------------------------------------------------------------
// Request Display Updates
// -------------------------------------------------------------------------------------
    private _requestDispUpdate() {
        if (this._coordSetId == null)
            return;

        if (!this.needsUpdate)
            return;

        this.needsUpdate = false;

        if (!this.lookupCache.isReady())
            return;

        let area = this.config.viewPort.window;
        let zoom = this.config.viewPort.zoom;

        let viewingGridKeys = gridKeysForArea(this._coordSetId, area, zoom);

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

            if (!linkedGrid.hasData())
                continue;

            // If we're not viewing this grid any more, discard the data.
            if (!this._viewingGridKeysDict.hasOwnProperty(linkedGrid.gridKey))
                continue;

            this._gridBuffer[linkedGrid.gridKey] = linkedGrid;
        }

        // This has it's own timing log
        this._compileDisps();
    }


// -------------------------------------------------------------------------------------
// Display Items
// -------------------------------------------------------------------------------------

    viewableDisps() {
        return this._visableDisps;
    }

    selectableDisps() {
        return this.viewableDisps().filter((disp) => {
            let type_ = DispFactory.type(disp);
            return type_ == DispType.action || type_ == DispType.polyline;
        });
    }

    selectedDisps() {
        return this._selection;
    }

    private _compileDisps() {

        if (this._coordSetId == null)
            return;

        let startTime = now();

        let levelsOrderedByOrder = this.lookupCache.levelsOrderedByOrder(this._coordSetId);
        let layersOrderedByOrder = this.lookupCache.layersOrderedByOrder();

        let zoom = this.config.viewPort.zoom;

        let dispIndexByGridKey = {};

        let disps = [];
        let dispIdsAdded = {};

        let viewableGrids = dictKeysFromObject(this._viewingGridKeysDict);

        for (let levelIndex = 0; levelIndex < levelsOrderedByOrder.length; levelIndex++) {
            let level: DispLevel = <DispLevel> levelsOrderedByOrder[levelIndex];

            // If it's not in the zoom area, continue
            if (!(level.minZoom <= zoom && zoom < level.maxZoom))
                continue;

            for (let layerIndex = 0; layerIndex < layersOrderedByOrder.length; layerIndex++) {
                let layer: DispLayer = <DispLayer> layersOrderedByOrder[layerIndex];

                // If it's not visible (enabled), continue
                if (!layer.visible)
                    continue;

                for (let gridKeyIndex = 0; gridKeyIndex < viewableGrids.length; gridKeyIndex++) {
                    let gridKey = viewableGrids[gridKeyIndex];
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

                        // // Level first, as per the sortDisps function
                        if (disp.level.order < level.order)
                            continue;

                        if (level.order < disp.level.order)
                            break;

                        // Then Layer
                        if (disp.layer.order < layer.order)
                            continue;

                        if (layer.order < disp.layer.order)
                            break;

                        if (dispIdsAdded[disp.id] === true)
                            continue;

                        disps.push(disp);
                        dispIdsAdded[disp.id] = true;
                    }

                    dispIndexByGridKey[gridKey] = nextIndex;
                }
            }
        }

        this._visableDisps = disps;
        this.config.model.dispOnScreen = disps.length;
        this.config.invalidate();

        let timeTaken = now() - startTime;

        console.log(`${dateStr()} Model: compileDisps took ${timeTaken}ms`
            + ` for ${disps.length} disps and ${viewableGrids.length} grids`);
    }

    addSelection(objectOrArray) {
        this._selection = this._selection.add(objectOrArray);
        this.config.invalidate();

        /*
         // HACK, HACK, HACK!!!! ZebBen Menu
         if (this._selection.length >= 1 && this._selection[0]._tt == 'DA') {
         let dispAction = this._selection[0];

         if (dispAction.d.action != null
         && dispAction.d.action.indexOf('Popup Menu') != -1) {
         displayCanvasPopupMenu(this._scope, this._$uibModal, dispAction);
         }
         }
         */
    }

    removeSelection(objectOrArray) {
        this._selection = this._selection.remove(objectOrArray);
        this.config.invalidate();
    }

    clearSelection() {
        this._selection = [];
        this.config.invalidate();
    }

}