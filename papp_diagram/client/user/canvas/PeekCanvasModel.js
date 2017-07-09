/**
 * Peek Canvas Model
 *
 * This class stores and manages the model of the NodeCoord and ConnCoord
 * objects that are within the viewable area.
 *
 */

define("PeekCanvasModel", [
            // Named Depencencies
            "PayloadEndpoint",
            "PeekModelGridDataManager"
            // Unnamed Dependencies
        ], function (PayloadEndpoint, gridDataManager) {
            function PeekCanvasModel($scope, config, $uibModal) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._$uibModal = $uibModal;

                self._coordSetId = null;

                // The currently selected coords
                self._selection = [];

                // Objects to be drawn on the display
                self._visableDisps = [];

                // Store grids from the server by gridKey.
                self._bufferedGridsByGridKey = {};

                // Grid Key storage holders
                self._viewingGridKeyDict = {};
                self._loadedGridKeyDict = {};
                self._outstandingRequestedGridKeys = {};

                // Create a commonly used closure
                self._receiveGridClosure = bind(self, self._receiveGrid);

            }


// -------------------------------------------------------------------------------------
// init
// -------------------------------------------------------------------------------------
            PeekCanvasModel.prototype.init = function () {
                var self = this;

                self.needsUpdate = false;

                // Start the draw timer.
                setInterval(bind(self, self._requestDispUpdate),
                        self._config.controller.updateInterval);

                // Subscribe to grid updates, when the data store gets and update
                // from the server, we will

                gridDataManager.gridUpdatesNotify.add(self._receiveGridClosure);
                self._scope.$on("$destroy", function () {
                    gridDataManager.gridUpdatesNotify.remove(self._receiveGridClosure);
                });

                // Watch for changes to the config that effect us
                self._scope.$watch(function () {
                    return self._config.controller.coordSet;
                }, function (coordSet) {
                    if (coordSet == null) {
                        self._config.canvas.pan.x = 0.0;
                        self._config.canvas.pan.y = 0.0;
                        self._config.canvas.zoom = 1.0;
                        self._coordSetId = null;

                    } else {
                        self._config.canvas.pan.x = coordSet.initialPanX;
                        self._config.canvas.pan.y = coordSet.initialPanY;
                        self._config.canvas.zoom = coordSet.initialZoom;
                        self._coordSetId = coordSet.id;
                    }

                    self.reset();
                    self.needsUpdate = true;
                });

                // Watch the canvas settings, if they change then request and update from
                // the cache
                self._scope.$watch(function () {
                    return JSON.stringify(self._config.canvas.window);
                }, function () {
                    self.needsUpdate = true;
                });

            };


// -------------------------------------------------------------------------------------
// reset
// -------------------------------------------------------------------------------------
            PeekCanvasModel.prototype.reset = function () {
                var self = this;

                self.needsUpdate = false;
                self.isUpdating = false;

                self._selection = []; // The currently selected coords

                self._visableDisps = []; // Objects to be drawn on the display
                self._gridBuffer = {}; // Store grids from the server by gridKey.

                // These are being used as sets, The values are just = true
                self._viewingGridKeyDict = {};
                self._loadedGridKeyDict = {};
                self._outstandingRequestedGridKeys = {};
            };


// -------------------------------------------------------------------------------------
// Request Display Updates
// -------------------------------------------------------------------------------------
            PeekCanvasModel.prototype._requestDispUpdate = function () {
                var self = this;

                if (self._coordSetId == null)
                    return;

                if (!self.needsUpdate)
                    return;
                self.needsUpdate = false;

                if (!gridDataManager.isReady())
                    return;

                var area = self._config.canvas.window;
                var zoom = self._config.canvas.zoom;

                var viewingGridKeys = gridKeysForArea(self._coordSetId, area, zoom);

                // If there is no change, then do nothing
                if (viewingGridKeys.join() == dictKeysFromObject(self._viewingGridKeyDict).join())
                    return;

                // Notify the grid manager that the view has changed
                gridDataManager.canvasViewChanged(
                        self._config.controller.uniquFiltId,
                        viewingGridKeys);

                self._viewingGridKeyDict = dictSetFromArray(viewingGridKeys);


                var loadedGridKeys = dictKeysFromObject(self._bufferedGridsByGridKey);

                var gridKeysToRemove = loadedGridKeys.diff(viewingGridKeys);
                var gridKeysToGet = viewingGridKeys.diff(loadedGridKeys);

                // // Remove is called first, request immediatly populates from mem cache
                // self._removeGrids(gridKeysToRemove);
                self._requestGrids(gridKeysToGet);

                self._config.model.gridsWaitingForData =
                        dictKeysFromObject(self._outstandingRequestedGridKeys).length;

                self._compileDisps();
            };


// -------------------------------------------------------------------------------------
// Request grids
// -------------------------------------------------------------------------------------

            PeekCanvasModel.prototype._removeGrids = function (gridKeysToRemove) {
                var self = this;

                if (gridKeysToRemove.length == 0)
                    return;

                for (var i = 0; i < gridKeysToRemove.length; i++) {
                    var gridKey = gridKeysToRemove[i];
                    if (self._bufferedGridsByGridKey[gridKey] != null) {
                        delete self._bufferedGridsByGridKey[gridKey];
                    }
                }

            };


// -------------------------------------------------------------------------------------
// Request grids
// -------------------------------------------------------------------------------------

            PeekCanvasModel.prototype._requestGrids = function (gridKeysToGet) {
                var self = this;

                if (gridKeysToGet.length == 0)
                    return;

                // Some grid keys that we don't have yet might be in the process of being
                // requested

                var unrequestedGridKeys = [];
                for (var i = 0; i < gridKeysToGet.length; i++) {
                    var gridKey = gridKeysToGet[i];
                    if (self._outstandingRequestedGridKeys[gridKey] != true) {
                        self._outstandingRequestedGridKeys[gridKey] = true;
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
            PeekCanvasModel.prototype._receiveGrid = function (canvasModelGrids, fromServer) {
                var self = this;

                // Overwrite with all the new ones
                for (var i = 0; i < canvasModelGrids.length; i++) {
                    var modelGrid = canvasModelGrids[i];

                    if (fromServer) {
                        self._loadedGridKeyDict[modelGrid.gridKey] = true;
                        delete self._outstandingRequestedGridKeys[modelGrid.gridKey];
                    }

                    if (!modelGrid.hasData())
                        continue;

                    // If we're not viewing this grid any more, discard the data.
                    if (self._viewingGridKeyDict[modelGrid.gridKey] !== true)
                        continue;

                    self._bufferedGridsByGridKey[modelGrid.gridKey] = modelGrid;
                }

                // Updte the grids waiting for data count
                self._config.model.gridsWaitingForData =
                        dictKeysFromObject(self._outstandingRequestedGridKeys).length;

                // This has it's own timing log
                self._compileDisps();
            };

// -------------------------------------------------------------------------------------
// Display Items
// -------------------------------------------------------------------------------------

            PeekCanvasModel.prototype.viewableDisps = function () {
                var self = this;

                return self._visableDisps;
            };

            PeekCanvasModel.prototype.selectableDisps = function () {
                var self = this;

                return self.viewableDisps().filter(function (disp) {
                    return disp._tt == 'DA' || disp._tt == 'DPL';
                });
            };

            PeekCanvasModel.prototype.selectedDisps = function () {
                var self = this;

                return self._selection;
            };

            PeekCanvasModel.prototype._compileDisps = function () {
                var self = this;

                if (self._coordSetId == null)
                    return;

                var startTime = new Date();

                var levelsOrderedByOrder = gridDataManager.levelsOrderedByOrder(self._coordSetId);
                var layersOrderedByOrder = gridDataManager.layersOrderedByOrder();

                var zoom = self._config.canvas.zoom;

                var dispIndexByGridKey = {};

                var disps = [];
                var dispIdsAdded = {};

                var viewableGrids = dictKeysFromObject(self._viewingGridKeyDict);

                for (var levelIndex = 0; levelIndex < levelsOrderedByOrder.length; levelIndex++) {
                    var level = levelsOrderedByOrder[levelIndex];

                    // If it's not in the zoom area, continue
                    if (!(level.minZoom <= zoom && zoom < level.maxZoom))
                        continue;

                    for (var layerIndex = 0; layerIndex < layersOrderedByOrder.length; layerIndex++) {
                        var layer = layersOrderedByOrder[layerIndex];

                        // If it's not visible (enabled), continue
                        if (!layer.visible)
                            continue;

                        for (var gridKeyIndex = 0; gridKeyIndex < viewableGrids.length; gridKeyIndex++) {
                            var gridKey = viewableGrids[gridKeyIndex];
                            var grid = self._bufferedGridsByGridKey[gridKey];

                            if (grid == null)
                                continue;

                            // If this is the first iteration, initialise to 0
                            var nextIndex = dispIndexByGridKey[gridKey];
                            if (nextIndex == null)
                                nextIndex = 0;

                            // If we've processed all the disps in this grid, continue to next
                            if (nextIndex >= grid.disps.length)
                                continue;

                            for (; nextIndex < grid.disps.length; nextIndex++) {
                                var disp = grid.disps[nextIndex];

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

                self._visableDisps = disps;
                self._config.model.dispOnScreen = disps.length;
                self._config.invalidate();

                var timeTaken = new Date() - startTime;

                console.log(dateStr() + "Model: compileDisps"
                        + " took " + timeTaken + "ms"
                        + " for " + disps.length + " disps"
                        + " and " + viewableGrids.length + " grids");
            };


            PeekCanvasModel.prototype.addSelection = function (objectOrArray) {
                var self = this;

                self._selection = self._selection.add(objectOrArray);
                self._config.renderer.invalidate = true;

                // HACK, HACK, HACK!!!! ZebBen Menu
                if (self._selection.length >= 1 && self._selection[0]._tt == 'DA') {
                    var dispAction = self._selection[0];

                    if (dispAction.d.action != null
                            && dispAction.d.action.indexOf('Popup Menu') != -1) {
                        displayCanvasPopupMenu(self._scope, self._$uibModal, dispAction);
                    }
                }
            };

            PeekCanvasModel.prototype.removeSelection = function (objectOrArray) {
                var self = this;

                self._selection = self._selection.remove(objectOrArray);
                self._config.renderer.invalidate = true;
            };

            PeekCanvasModel.prototype.clearSelection = function () {
                var self = this;

                self._selection = [];
                self._config.renderer.invalidate = true;
            };

// -------------------------------------------------------------------------------------
// LAYERS
// -------------------------------------------------------------------------------------

            PeekCanvasModel.prototype.layers = function () {
                var self = this;

                return self._layers;
            };


            return PeekCanvasModel;
        }
)
;