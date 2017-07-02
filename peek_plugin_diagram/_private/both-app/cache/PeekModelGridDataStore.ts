/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';


/** Peek Model Cache Class
 *
 * This class is responsible for serving data to the canvas instances ("PeekCanvasCtrl")
 *
 * The class uses the browsers IndexedDB to store data, this has a limit of 250mb in IE11
 *
 * The class immediately responds to requests, returning the data from the cache first.
 * It then sends a request to the server to get an update, when the update arrives
 * this class updates the cache then sends the update to the canvas instance.
 *
 */
define('PeekModelGridDataStore', [
            // Named Dependencies
            "PeekModelWebSqlDb", "PeekModelIndexedDb", "PeekModelNoopDb",
            "PayloadEndpoint", "Payload",
            // Unnamed Dependencies
            "Vortex", "jquery",
            // Require the Browser Cache storage classes
            "PeekModelGridKey"
        ],
        function (PeekModelWebSqlDb, PeekModelIndexedDb, PeekModelNoopDb,
                  PayloadEndpoint, Payload) {
            function PeekModelGridDataStore(gridLookupStore) {
                var self = this;

                self._gridLookupStore = gridLookupStore;
                self._gridBuffer = {}; // Store grids from the server by gridKey.

                var providers = [PeekModelWebSqlDb,
                    PeekModelIndexedDb];

                for (var i = 0; i < providers.length; i++) {
                    var SqlDb = providers[i];
                    try {
                        self._gridDataStore = new SqlDb();
                        break;
                    } catch (e) {
                        console.log("ERROR LOADING" + SqlDb);
                        console.log(e);
                    }
                }

                if (self._gridDataStore) {
                    logInfo("Using " + self._gridDataStore.name + " Client Caching");
                } else {
                    self._gridDataStore = new PeekModelNoopDb();
                    logWarning("Client caching not supported, we'll work with out it.");
                }

                self._gridUpdatesNofity = $.Callbacks('unique');


                self._modelServerListenFilt = {key: "repo.client.grid.update_check"};
                self._modelServerEndpoint = new PayloadEndpoint(self._modelServerListenFilt,
                        bind(self, self._processServerPayload));

                self._init();


            }

// ============================================================================
// Init

            PeekModelGridDataStore.prototype.isReady = function () {
                var self = this;
                return true;
            };

// ============================================================================
// Init the class

            PeekModelGridDataStore.prototype._init = function () {
                var self = this;

            };


// ============================================================================
// Handlers for display data

            /** Load grid keys
             *
             * @param gridKeys : The new grid keys to load
             */
            PeekModelGridDataStore.prototype.loadGridKeys = function (requestedGridKeys) {
                var self = this;

                // Delay the loading if the cache is not yet initiailised
                if (self._gridDataStore == null || !self._gridDataStore.isReady()) {
                    console.log(dateStr() + "Cache: Delaying call loadFromDispCache, things arn't ready yet");
                    setTimeout(function () {
                        self.loadGridKeys(requestedGridKeys);
                    }, 5);
                    return;
                }

                // LOAD FROM MEMCACHE FIRST
                var gridKeysNotInMemory = [];
                var modelGrids = [];

                var requestServerUpdatesFilt = $.extend(
                        {
                            grids: []
                        },
                        self._modelServerListenFilt
                );


                // Merge in the buffered responses with the server updates.
                for (var i = 0; i < requestedGridKeys.length; i++) {
                    var requestedGridKey = requestedGridKeys[i];

                    var modelGridFromMemCache = self._gridBuffer[requestedGridKey];

                    if (modelGridFromMemCache) {
                        modelGrids.push(modelGridFromMemCache);

                        // Add to our list of server update checks
                        requestServerUpdatesFilt.grids.push({
                            gridKey: modelGridFromMemCache.gridKey,
                            lastUpdate: modelGridFromMemCache.lastUpdate
                        });

                    } else {
                        gridKeysNotInMemory.push(requestedGridKey);

                    }
                }

                // Ask the indexeddb about the remainder
                self._gridDataStore.loadFromDispCache(
                        gridKeysNotInMemory, bind(self, self._processCachedLoadedGrids));

                // Give the grid updates from memory to the canvas(es)
                self._gridUpdatesNofity.fire(modelGrids, false);

                if (requestServerUpdatesFilt.grids.length) {
                    // Ask the server for updates for the grids we just got from memory
                    console.log(dateStr() + "Cache.loadGridKeys: Requesting grids from" +
                            " server : " + requestServerUpdatesFilt.grids);
                    vortexSendFilt(requestServerUpdatesFilt);
                }

            };


            PeekModelGridDataStore.prototype._processServerPayload = function (payload) {
                var self = this;

                if (payload.result) {
                    logError(dateStr() + "GridDataStore: Grid update failed : " + payload.result);
                    return;
                }

                var compiledGrids = payload.tuples;
                var requestedGridKeys = {};

                // Grid updates for observed grids won't have grid keys.
                if (payload.filt.gridKeys != null)
                    requestedGridKeys = dictSetFromArray(payload.filt.gridKeys);

                // List of modelGrids to sent to canvas
                var modelGrids = [];

                // Overwrite with all the new ones
                for (var i = 0; i < compiledGrids.length; i++) {
                    var compiledGrid = compiledGrids[i];

                    var modelGrid = new PeekCanvasModelGrid(self._gridLookupStore, compiledGrid);
                    self._gridBuffer[modelGrid.gridKey] = modelGrid;
                    modelGrids.push(modelGrid);
                    delete requestedGridKeys[modelGrid.gridKey]

                }

                // If the keys arn't in the server, then they don't exist
                requestedGridKeys = dictKeysFromObject(requestedGridKeys);
                for (var i = 0; i < requestedGridKeys.length; i++) {
                    var requestedGridKey = requestedGridKeys[i];

                    // Create the empty model grid.
                    var modelGrid = new PeekCanvasModelGrid(requestedGridKey);
                    self._gridBuffer[modelGrid.gridKey] = modelGrid;
                    modelGrids.push(modelGrid);
                }

                // Inform the canvas(es) that we have grid updates
                self._gridUpdatesNofity.fire(modelGrids, true);

                // Update the index db
                self._gridDataStore.updateDispCache(compiledGrids);

                console.log(dateStr() + "Cache: Loaded " + compiledGrids.length
                        + " compiled grids from server - " + requestedGridKeys);
            };


            PeekModelGridDataStore.prototype._processCachedLoadedGrids = function (requestedGridKeys, compiledGrids) {
                var self = this;

                // Filt to ask the server for updates
                var filt = $.extend({
                            grids: []
                        },
                        self._modelServerListenFilt);

                var gridKeysLoadedFromCache = {};

                // Overwrite with all the new ones
                var modelGrids = [];
                for (var i = 0; i < compiledGrids.length; i++) {
                    var compiledGrid = compiledGrids[i];

                    // Server update request
                    filt.grids.push({
                        gridKey: compiledGrid.gridKey,
                        lastUpdate: compiledGrid.lastUpdate
                    });
                    gridKeysLoadedFromCache[compiledGrid.gridKey] = true;

                    // Load disps and buffer in memory
                    var modelGrid = new PeekCanvasModelGrid(self._gridLookupStore, compiledGrid);
                    self._gridBuffer[modelGrid.gridKey] = modelGrid;
                    modelGrids.push(modelGrid);
                }

                // Inform the canvas(es) that we have grid updates
                self._gridUpdatesNofity.fire(modelGrids, false);


                // The grids not in the cache
                for (var i = 0; i < requestedGridKeys.length; i++) {
                    var gridKey = requestedGridKeys[i];
                    if (gridKeysLoadedFromCache[gridKey] == true) {
                        continue;
                    }

                    filt.grids.push({
                        gridKey: gridKey,
                        lastUpdate: ''
                    });
                }

                if (filt.grids.length) {
                    console.log(dateStr() + "Cache: Requesting grids from server : " + requestedGridKeys);
                    vortexSendFilt(filt);
                }

            };


// -------------------------------------------------------------------------------------
// MODEL GRID
// -------------------------------------------------------------------------------------

            function PeekCanvasModelGrid(lookupStore, serverCompiledGrid) {
                var self = this;
                self.gridKey = null;
                self.lastUpdate = null;
                self.loadedFromServerDate = new Date();
                self.disps = [];

                // initialise for empty grid keys
                if (typeof lookupStore == "string") {
                    var gridKey = lookupStore;
                    self.gridKey = gridKey;
                    return;
                }

                self.gridKey = serverCompiledGrid.gridKey;
                self.lastUpdate = serverCompiledGrid.lastUpdate;
                self.loadedFromServerDate = new Date();

                self.disps = [];
                var disps = [];

                if (serverCompiledGrid.blobData != null
                && serverCompiledGrid.blobData.length != 0) {
                    var pako = requirejs("pako");
                    try {
                        var dispJsonStr = pako.inflate(serverCompiledGrid.blobData, {to: 'string'});
                        disps = JSON.parse(dispJsonStr);
                    } catch (e) {
                        console.error(e.message);
                    }
                }

                // Resolve the lookups
                for (var j = 0; j < disps.length; j++) {
                    var disp = disps[j];
                    if (disp.id == null) {
                        // This mitigates an old condition caused by the grid compiler
                        // including dips that had not yet had json assigned.
                        continue;
                    }
                    if (lookupStore.linkDispLookups(disp) != null) {
                        self.disps.push(disp);
                    }
                }
            }

            PeekCanvasModelGrid.prototype.hasData = function () {
                var self = this;
                return !(self.lastUpdate == null && self.disps.length == 0);
            };

// ============================================================================
// Create Grid Data

            return PeekModelGridDataStore;
        }
)
;

