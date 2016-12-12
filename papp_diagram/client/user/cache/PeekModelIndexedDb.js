/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';

define('PeekModelIndexedDb', [],
        function () {
            if (!window.indexedDB) {
                window.indexedDB = window.indexedDB || window.mozIndexedDB
                        || window.webkitIndexedDB || window.msIndexedDB;
            }

            if (!window.IDBTransaction) {
                window.IDBTransaction = window.IDBTransaction
                        || window.webkitIDBTransaction || window.msIDBTransaction;
            }

            if (!window.IDBKeyRange) {
                window.IDBKeyRange = window.IDBKeyRange
                        || window.webkitIDBKeyRange || window.msIDBKeyRange;
            }
//
// if (!window.indexedDB) {
//     window.alert("Your browser doesn't support a stable version of IndexedDB.")
// }

            function IDBException(message) {
                this.message = message;
            }

            IDBException.prototype.toString = function () {
                return 'IndexedDB : IDBException: ' + this.message;
            };

            function addIndexedDbHandlers(request, stacktraceFunctor) {
                request.onerror = function (request) {
                    console.log(dateStr() + "IndexedDB : ERROR " + request.target.error);
                    logError("IndexedDB : ERROR " + request.target.error);
                    stacktraceFunctor();
                };

                request.onabort = function (request) {
                    console.log(dateStr() + "IndexedDB : ABORT " + request.target.error);
                    logError("IndexedDB : ABORT " + request.target.error);
                    stacktraceFunctor();
                };

                request.onblock = function (request) {
                    console.log(dateStr() + "IndexedDB : BLOCKED " + request.target.error);
                    logError("IndexedDB : BLOCKED " + request.target.error);
                    stacktraceFunctor();
                };

            }


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
            function PeekModelIndexedDb() {
                var self = this;
                self.name = "IndexedDB";

                // DISP Store
                self.GRID_STORE = "grid";
                self.GRID_STORE_INDEX = "gridIndex";

                var request = window.indexedDB.open("peek", 1);
                addIndexedDbHandlers(request, function () {
                    throw new IDBException("DB Open");
                });


                request.onsuccess = function (event) {
                    console.log(dateStr() + "Success opening DB");
                    self.db = event.target.result;
                };

                request.onupgradeneeded = function (event) {
                    console.log(dateStr() + "IndexedDB : Upgrading");
                    self.db = event.target.result;

                    // SCHEMA for database points
                    var gridStore = self.db.createObjectStore(self.GRID_STORE,
                            {keyPath: "gridKey"});

                    console.log(dateStr() + "IndexedDB : Upgrade Success");

                };
            }

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelIndexedDb.prototype.isReady = function () {
                var self = this;
                return self.db != null;
            };

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelIndexedDb.prototype.loadFromDispCache = function (gridKeys, callback) {
                var self = this;

                // Now put the data.
                var tx = self.db.transaction(self.GRID_STORE, "readonly");
                var store = tx.objectStore(self.GRID_STORE);

                function loadGridKey(gridKey) {
                    var startTime = new Date();

                    var request = store.get(gridKey);
                    addIndexedDbHandlers(request, function () {
                        throw new IDBException("Index open cursor")
                    });

                    request.onsuccess = function () {

                        var compiledGrids = [];

                        var timeTaken = new Date() - startTime;
                        console.log(dateStr() + "IndexedDB: loadFromDispCache"
                                + " took " + timeTaken + "ms (in thread)");

                        // Called for each matching record
                        var data = request.result;
                        if (data) {
                            compiledGrids.push(data);
                        }

                        callback([gridKey], compiledGrids);
                    };
                }

                for (var gki = 0; gki < gridKeys.length; ++gki) {
                    loadGridKey(gridKeys[gki]);
                }

            };


// ----------------------------------------------------------------------------
// Add disply items to the cache

            PeekModelIndexedDb.prototype.updateDispCache = function (gridsCompiled) {
                var self = this;

                if (!gridsCompiled.length)
                    return;

                var startTime = new Date();

                return new Promise(function (resolve, reject) {

                    var tx = self.db.transaction(self.GRID_STORE, "readwrite");
                    addIndexedDbHandlers(tx, function () {
                        throw new IDBException("Transaction error");
                        reject();
                    });

                    tx.oncomplete = function () {
                        var timeTaken = new Date() - startTime;
                        console.log(dateStr() + "IndexedDB: updateDispCache"
                                + " took " + timeTaken + "ms (in thread)"
                                + " Inserted/updated " + gridsCompiled.length + " compiled grids");
                        resolve();
                    };

                    var store = tx.objectStore(self.GRID_STORE);

                    // Run the inserts
                    for (var i = 0; i < gridsCompiled.length; i++) {
                        store.put(gridsCompiled[i]);
                    }
                });


            };

            return PeekModelIndexedDb;
        }
);