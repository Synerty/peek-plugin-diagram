import {Injector} from "@angular/core";

/**
 * Peek Canvas Model
 *
 * This class stores and manages the model of the NodeCoord and ConnCoord
 * objects that are within the viewable area.
 *
 */

@Injector()
export class PeekCanvasModel {

    _coordSetId = null;

    // The currently selected coords
    _selection = [];

    // Objects to be drawn on the display
    _visableDisps = [];

    // Store grids from the server by gridKey.
    _bufferedGridsByGridKey = {};

    // Grid Key storage holders
    _viewingGridKeyDict = {};
    _loadedGridKeyDict = {};
    _outstandingRequestedGridKeys = {};

    // Create a commonly used closure
    _receiveGridClosure = null;

    constructor(private config, private $uibModal) {


        // Create a commonly used closure
        this._receiveGridClosure = (canvasModelGrids, fromServer) => {
            this._receiveGrid(canvasModelGrids, fromServer);
        };

    }


// -------------------------------------------------------------------------------------
// init
// -------------------------------------------------------------------------------------
    init() {


        this.needsUpdate = false;

        // Start the draw timer.
        setInterval(bind(self, this._requestDispUpdate),
            this._config.controller.updateInterval);

        // Subscribe to grid updates, when the data store gets and update
        // from the server, we will

        gridDataManager.gridUpdatesNotify.add(this._receiveGridClosure);
        this._scope.$on("$destroy", function () {
            gridDataManager.gridUpdatesNotify.remove(this._receiveGridClosure);
        });

        // Watch for changes to the config that effect us
        this._scope.$watch(function () {
            return this._config.controller.coordSet;
        }, function (coordSet) {
            if (coordSet == null) {
                this._config.canvas.pan.x = 0.0;
                this._config.canvas.pan.y = 0.0;
                this._config.canvas.zoom = 1.0;
                this._coordSetId = null;

            } else {
                this._config.canvas.pan.x = coordSet.initialPanX;
                this._config.canvas.pan.y = coordSet.initialPanY;
                this._config.canvas.zoom = coordSet.initialZoom;
                this._coordSetId = coordSet.id;
            }

            this.reset();
            this.needsUpdate = true;
        });

        // Watch the canvas settings, if they change then request and update from
        // the cache
        this._scope.$watch(function () {
            return JSON.stringify(this._config.canvas.window);
        }, function () {
            this.needsUpdate = true;
        });

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

        // These are being used as sets, The values are just = true
        this._viewingGridKeyDict = {};
        this._loadedGridKeyDict = {};
        this._outstandingRequestedGridKeys = {};
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

        if (!gridDataManager.isReady())
            return;

        let area = this._config.canvas.window;
        let zoom = this._config.canvas.zoom;

        let viewingGridKeys = gridKeysForArea(this._coordSetId, area, zoom);

        // If there is no change, then do nothing
        if (viewingGridKeys.join() == dictKeysFromObject(this._viewingGridKeyDict).join())
            return;

        // Notify the grid manager that the view has changed
        gridDataManager.canvasViewChanged(
            this._config.controller.uniquFiltId,
            viewingGridKeys);

        this._viewingGridKeyDict = dictSetFromArray(viewingGridKeys);


        let loadedGridKeys = dictKeysFromObject(this._bufferedGridsByGridKey);

        let gridKeysToRemove = loadedGridKeys.diff(viewingGridKeys);
        let gridKeysToGet = viewingGridKeys.diff(loadedGridKeys);

        // // Remove is called first, request immediatly populates from mem cache
        // this._removeGrids(gridKeysToRemove);
        this._requestGrids(gridKeysToGet);

        this._config.model.gridsWaitingForData =
            dictKeysFromObject(this._outstandingRequestedGridKeys).length;

        this._compileDisps();
    };


// -------------------------------------------------------------------------------------
// Request grids
// -------------------------------------------------------------------------------------

    private _removeGrids(gridKeysToRemove) {


        if (gridKeysToRemove.length == 0)
            return;

        for (let i = 0; i < gridKeysToRemove.length; i++) {
            let gridKey = gridKeysToRemove[i];
            if (this._bufferedGridsByGridKey[gridKey] != null) {
                delete this._bufferedGridsByGridKey[gridKey];
            }
        }

    };


// -------------------------------------------------------------------------------------
// Request grids
// -------------------------------------------------------------------------------------

    private _requestGrids(gridKeysToGet) {


        if (gridKeysToGet.length == 0)
            return;

        // Some grid keys that we don't have yet might be in the process of being
        // requested

        let unrequestedGridKeys = [];
        for (let i = 0; i < gridKeysToGet.length; i++) {
            let gridKey = gridKeysToGet[i];
            if (this._outstandingRequestedGridKeys[gridKey] != true) {
                this._outstandingRequestedGridKeys[gridKey] = true;
                unrequestedGridKeys.push(gridKey);
            }
        }

        if (unrequestedGridKeys.length == 0)
            return;

        console.log(dateStr() + "Model: Requesting " + unrequestedGridKeys);

        // We want the grid keys sent back so we know the full grids we're loading
        gridDataManager.loadGridKeys(unrequestedGridKeys);

    };

// -------------------------------------------------------------------------------------
// Process Display Updates
// -------------------------------------------------------------------------------------
    /** Receive Grid
     *
     * NOTE: The grid data is not received in order,
     * and sometimes the ModelGrids don't have data when no
     * update from the server is requird.
     *
     * @param canvasModelGrids
     * @param fromServer
     * @private
     */
    private _receiveGrid(canvasModelGrids, fromServer) {


        // Overwrite with all the new ones
        for (let i = 0; i < canvasModelGrids.length; i++) {
            let modelGrid = canvasModelGrids[i];

            if (fromServer) {
                this._loadedGridKeyDict[modelGrid.gridKey] = true;
                delete this._outstandingRequestedGridKeys[modelGrid.gridKey];
            }

            if (!modelGrid.hasData())
                continue;

            // If we're not viewing this grid any more, discard the data.
            if (this._viewingGridKeyDict[modelGrid.gridKey] !== true)
                continue;

            this._bufferedGridsByGridKey[modelGrid.gridKey] = modelGrid;
        }

        // Updte the grids waiting for data count
        this._config.model.gridsWaitingForData =
            dictKeysFromObject(this._outstandingRequestedGridKeys).length;

        // This has it's own timing log
        this._compileDisps();
    };

// -------------------------------------------------------------------------------------
// Display Items
// -------------------------------------------------------------------------------------

    viewableDisps() {


        return this._visableDisps;
    };

    selectableDisps() {


        return this.viewableDisps().filter(function (disp) {
            return disp._tt == 'DA' || disp._tt == 'DPL';
        });
    };

    selectedDisps() {


        return this._selection;
    };

    private _compileDisps() {


        if (this._coordSetId == null)
            return;

        let startTime = new Date();

        let levelsOrderedByOrder = gridDataManager.levelsOrderedByOrder(this._coordSetId);
        let layersOrderedByOrder = gridDataManager.layersOrderedByOrder();

        let zoom = this._config.canvas.zoom;

        let dispIndexByGridKey = {};

        let disps = [];
        let dispIdsAdded = {};

        let viewableGrids = dictKeysFromObject(this._viewingGridKeyDict);

        for (let levelIndex = 0; levelIndex < levelsOrderedByOrder.length; levelIndex++) {
            let level = levelsOrderedByOrder[levelIndex];

            // If it's not in the zoom area, continue
            if (!(level.minZoom <= zoom && zoom < level.maxZoom))
                continue;

            for (let layerIndex = 0; layerIndex < layersOrderedByOrder.length; layerIndex++) {
                let layer = layersOrderedByOrder[layerIndex];

                // If it's not visible (enabled), continue
                if (!layer.visible)
                    continue;

                for (let gridKeyIndex = 0; gridKeyIndex < viewableGrids.length; gridKeyIndex++) {
                    let gridKey = viewableGrids[gridKeyIndex];
                    let grid = this._bufferedGridsByGridKey[gridKey];

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
        this._config.model.dispOnScreen = disps.length;
        this._config.invalidate();

        let timeTaken = new Date() - startTime;

        console.log(dateStr() + "Model: compileDisps"
            + " took " + timeTaken + "ms"
            + " for " + disps.length + " disps"
            + " and " + viewableGrids.length + " grids");
    };


    addSelection(objectOrArray) {


        this._selection = this._selection.add(objectOrArray);
        this._config.renderer.invalidate = true;

        // HACK, HACK, HACK!!!! ZebBen Menu
        if (this._selection.length >= 1 && this._selection[0]._tt == 'DA') {
            let dispAction = this._selection[0];

            if (dispAction.d.action != null
                && dispAction.d.action.indexOf('Popup Menu') != -1) {
                displayCanvasPopupMenu(this._scope, this._$uibModal, dispAction);
            }
        }
    };

    removeSelection(objectOrArray) {


        this._selection = this._selection.remove(objectOrArray);
        this._config.renderer.invalidate = true;
    };

    clearSelection() {


        this._selection = [];
        this._config.renderer.invalidate = true;
    };

// -------------------------------------------------------------------------------------
// LAYERS
// -------------------------------------------------------------------------------------

    layers() {
        return this._layers;
    };


}