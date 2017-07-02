/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';


define('PeekModelNoopDb', [],
        function () {
            /** Peek Model Cache Class (No Operation)
             *
             * This class is responsible for serving data to the canvas instances ("PeekCanvasCtrl")
             *
             * The class is used when browser storage is not supported
             *
             * The class immediately responds to requests, returning the data from the cache first.
             * It then sends a request to the server to get an update, when the update arrives
             * this class updates the cache then sends the update to the canvas instance.
             *
             */
            function PeekModelNoopDb() {
                var self = this;
                self.name = "No";

            }

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelNoopDb.prototype.isReady = function () {
                var self = this;
                return true;
            };

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelNoopDb.prototype.loadFromDispCache = function (gridKeys, callback) {
                var self = this;

                for (var gki = 0; gki < gridKeys.length; ++gki) {
                    var gridKey = gridKeys[gki];
                    setTimeout(function () {
                        console.log(dateStr() + "NoopDB: loadFromDispCache"
                                + " passed back grid key " + gridKey);

                        callback([gridKey], []);

                    }, 1);
                }
            };

// ----------------------------------------------------------------------------
// Add disply items to the cache

            PeekModelNoopDb.prototype.updateDispCache = function (gridsCompiled) {
                var self = this;
                // Noop storage has no data
            };

            return PeekModelNoopDb;
        }
);