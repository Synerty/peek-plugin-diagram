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
define('PeekModelGridDataManager', [
            // Named Dependencies
            "PeekModelGridLookupStore", "PeekModelGridDataStore",
            "PayloadEndpoint", "Payload",
            // Unnamed Dependencies
            "Vortex", "jquery"
        ],
        function (PeekModelGridLookupStore, PeekModelGridDataStore,
                  PayloadEndpoint, Payload) {
            function PeekModelGridDataManager() {
                var self = this;

                // Create/store references to the data stores
                self._gridLookupStore = new PeekModelGridLookupStore();
                self._gridDataStore = new PeekModelGridDataStore(self._gridLookupStore);

                // Variables required to determine when we need to inform the
                // server of view changes.
                self._viewingGridKeysByCanvasId = {};

                // Callbacks for the canvas to receive updates from the server
                self.gridUpdatesNotify = self._gridDataStore._gridUpdatesNofity;

                // Copy over some methods
                self.loadGridKeys = bind(self._gridDataStore,
                        self._gridDataStore.loadGridKeys);

                // Copy over some accessors
                self.levelsOrderedByOrder = bind(self._gridLookupStore,
                        self._gridLookupStore.levelsOrderedByOrder);

                self.layersOrderedByOrder = bind(self._gridLookupStore,
                        self._gridLookupStore.layersOrderedByOrder);

                // Initiliase this class
                self._init();
            }

// ============================================================================
// Init

            PeekModelGridDataManager.prototype.isReady = function () {
                var self = this;
                return (self._gridLookupStore.isReady()
                && self._gridDataStore.isReady());
            };

// ============================================================================
// Accessors for common lookup data

            PeekModelGridDataManager.prototype._init = function () {
                var self = this;

            };


// ============================================================================
// Canvas viewing area changed

            PeekModelGridDataManager.prototype.canvasViewChanged
                    = function (canvasId, gridKeys) {
                var self = this;


                self._viewingGridKeysByCanvasId[canvasId] = gridKeys;

                var setOfGridKeys = {};
                var listOfGridKeys = dictValuesFromObject(self._viewingGridKeysByCanvasId);
                for (var i = 0; i < listOfGridKeys.length; i++) {
                    $.extend(setOfGridKeys, dictSetFromArray(listOfGridKeys[i]));
                }

                var filt = {
                    gridKeys: dictKeysFromObject(setOfGridKeys),
                    'key': "repo.client.grid.observe"
                };
                vortexSendFilt(filt);
            };


// ============================================================================
// Create manage model single instance

            return new PeekModelGridDataManager();
        }
)
;

