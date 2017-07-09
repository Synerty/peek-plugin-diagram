/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';

define('PeekModelWebSqlDb', [],
        function () {

            function WDBException(message) {
                this.message = message;
            }

            WDBException.prototype.toString = function () {
                return 'WDBException: ' + this.message;
            };

            function makeWebSqlErrorHandler(stacktraceFunctor) {
                return function (tx, err) {
                    if (err == null)
                        err = tx;
                    console.log("ERROR : CODE = " + err.code + " MSG = " + err.message);

                    // Bug in Safari (at least), when the user approves the storage space
                    // The WebSQL still gets the exception
                    // "there was not enough remaining storage space, or the storage quota was reached and the user declined to allow more space"
                    if (err.message.indexOf("there was not enough remaining storage space") != -1) {
                        console.error(dateStr() + "WebSQL: " + err.message);
                        stacktraceFunctor(true);
                        return;
                    }

                    logError("ERROR : " + err.message);
                    stacktraceFunctor();
                };
            }

            /* GridKeyIndexCompiled

             gridKey = Column(String, primary_key=True)
             blobData = Column(BLOB, nullable=False)
             lastUpdate = Column(DateTime, nullable=False)

             coordSetId = Column(Integer....
             gridKey = TupleField()
             */


            /** Peek Model Cache Class (WebSQL)
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
            function PeekModelWebSqlDb() {
                var self = this;
                self.name = "WebSQL";

                self._insertQueue = [];

                //Test for browser compatibility
                if (!window.openDatabase) {
                    throw new WDBException("WebSQL is not supported by your browser!");
                }

                //Create the database the parameters are
                // 1. the database name
                // 2.version number
                // 3. a description
                // 4. the size of the database (in bytes) 1024 x 1024 = 1MB
                self.db = openDatabase("peekv3", "1", "Peek Cache", 4 * 1024 * 1024);

                var createTableSql = "CREATE TABLE IF NOT EXISTS compiledGrids"
                        + "(gridKey PRIMARY KEY ASC,"
                        + "blobData TEXT,"
                        + "lastUpdate TEXT"
                        + ")";

                var createIndexSql = "CREATE UNIQUE INDEX IF NOT EXISTS compiledGridsIdx"
                        + " ON compiledGrids(gridKey)";

                var createSchemaSql = [createTableSql, createIndexSql];

                //create the cars table using SQL for the database using a transaction
                self.db.transaction(function (t) {
                    var sqlIndex = 0;

                    function execSql() {
                        var sql = createSchemaSql[sqlIndex];

                        t.executeSql(sql, [],
                                function (tx, rs) {
                                    sqlIndex++;
                                    if (sqlIndex < createSchemaSql.length) {
                                        execSql();
                                    } else {
                                        console.log(dateStr() + "WebSQL: Database opened successfully");
                                    }
                                },
                                makeWebSqlErrorHandler(function () {
                                    throw new WDBException("Create Schema Failed SQL is \n" + sql);
                                })
                        );
                    }

                    execSql();

                });

            }

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelWebSqlDb.prototype.isReady = function () {
                var self = this;
                return self.db != null;
            };

// ----------------------------------------------------------------------------
// Load the display items from the cache
            PeekModelWebSqlDb.prototype.loadFromDispCache = function (gridKeys, callback) {
                var self = this;

                function loadGridKey(gridKey) {
                    var startTime = new Date();

                    function processResults(transaction, results) {
                        try {

                            var compiledGrids = [];

                            //Iterate through the results
                            for (var i = 0; i < results.rows.length; i++) {
                                //Get the current row
                                var row = results.rows.item(i);

                                var compiledGrid = {
                                    gridKey: row.gridKey,
                                    blobData: row.blobData,
                                    lastUpdate: row.lastUpdate
                                };

                                compiledGrids.push(compiledGrid);
                            }

                            var timeTaken = new Date() - startTime;
                            console.log(dateStr() + "WebSQL: loadFromDispCache"
                                    + " took " + timeTaken + "ms (in thread)"
                                    + " retrieved 1 compiled grids");

                            callback([gridKey], compiledGrids);
                        } catch (e) {
                            logError(e.message);
                            console.trace(e);
                        }

                    }

                    //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
                    self.db.transaction(function (t) {
                                var qrySql = "SELECT * FROM compiledGrids WHERE gridKey = ? ";
                                t.executeSql(qrySql, [gridKey], processResults,
                                        makeWebSqlErrorHandler(function () {
                                            throw new WDBException("Query DB Error");
                                        })
                                );
                            }, makeWebSqlErrorHandler(function () {
                                throw new WDBException("Create Transaction Error");
                            })
                    );

                }

                for (var gki = 0; gki < gridKeys.length; ++gki) {
                    loadGridKey(gridKeys[gki]);
                }

            };


// ----------------------------------------------------------------------------
// Add disply items to the cache

            PeekModelWebSqlDb.prototype.updateDispCache = function (gridsCompiled) {
                var self = this;

                if (!gridsCompiled.length)
                    return;

                var startTime = new Date();

                function checkItemRetries(item) {

                    if (item._webSqlRetry == null) {
                        item._webSqlRetry = 0

                    } else {
                        item._webSqlRetry++;
                        if (item._webSqlRetry > 5) {
                            logError("Failed to cache new grids");
                            logError("Resetting Peek UI");
                            setTimeout(function () {
                                location.reload()
                            }, 3000);
                            return false;
                        }
                    }
                    return true;
                }

                if (!checkItemRetries(gridsCompiled))
                    return;


                // Run the inserts
                self.db.transaction(function (t) {
                    for (var i = 0; i < gridsCompiled.length; i++) {
                        var compiledGrid = gridsCompiled[i];

                        if (!checkItemRetries(compiledGrid))
                            return;

                        /*Insert the user entered details into the cars table,
                         note the use of the ? placeholder,
                         these will replaced by the data passed in as an array
                         as the second parameter*/

                        t.executeSql("INSERT OR REPLACE INTO compiledGrids"
                                + "(gridKey, blobData, lastUpdate)"
                                + "VALUES (?, ?, ?)",
                                [compiledGrid.gridKey,
                                    compiledGrid.blobData,
                                    compiledGrid.lastUpdate],
                                function () {
                                    var timeTaken = new Date() - startTime;
                                    console.log(dateStr() + "WebSQL: updateDispCache"
                                            + " took " + timeTaken + "ms (in thread)"
                                            + " Inserted/updated " + gridsCompiled.length + " compiled grids"
                                            + " Retries " + compiledGrid._webSqlRetry);
                                },
                                makeWebSqlErrorHandler(
                                        function (outOfSpaceRetry) {
                                            if (outOfSpaceRetry !== true)
                                                throw new WDBException(
                                                        "Execute Insert SQL Error");
                                            self.updateDispCache([compiledGrid]);
                                        }
                                )
                        );
                    }
                }, makeWebSqlErrorHandler(
                        function (outOfSpaceRetry) {
                            if (outOfSpaceRetry !== true)
                                throw new WDBException("Create Insert TX Error");
                            self.updateDispCache(gridsCompiled);
                        }));


            };


            return PeekModelWebSqlDb;
        }
);