import {dateStr} from "../DiagramUtil";
import { VortexService} from "@synerty/vortexjs";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";


class WDBException {
    constructor(private message) {
    }

    toString() {
        return 'WDBException: ' + this.message;
    }
}

function makeWebSqlErrorHandler(stacktraceFunctor) {
    return (tx, err) => {
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

        this.balloonMsg.showError("ERROR : " + err.message);
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

export class PeekModelWebSqlDb {
    readonly name = "WebSQL";

    private db: any;

    _insertQueue = [];

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private vortexService:VortexService) {

        //Test for browser compatibility
        if (!window.openDatabase) {
            throw new WDBException("WebSQL is not supported by your browser!");
        }

        //Create the database the parameters are
        // 1. the database name
        // 2.version number
        // 3. a description
        // 4. the size of the database (in bytes) 1024 x 1024 = 1MB
        this.db = openDatabase("peekv3", "1", "Peek Cache", 4 * 1024 * 1024);

        let createTableSql = `CREATE TABLE IF NOT EXISTS compiledGrids
            (
                gridKey PRIMARY KEY ASC,
                blobData TEXT,
                lastUpdate TEXT
            )`;

        let createIndexSql = "CREATE UNIQUE INDEX IF NOT EXISTS compiledGridsIdx"
            + " ON compiledGrids(gridKey)";

        let createSchemaSql = [createTableSql, createIndexSql];

        //create the cars table using SQL for the database using a transaction
        this.db.transaction((t) => {
            let sqlIndex = 0;

            let execSql = () => {
                let sql = createSchemaSql[sqlIndex];

                t.executeSql(sql, [],
                    (tx, rs) => {
                        sqlIndex++;
                        if (sqlIndex < createSchemaSql.length) {
                            execSql();
                        } else {
                            console.log(dateStr() + "WebSQL: Database opened successfully");
                        }
                    },
                    makeWebSqlErrorHandler(() => {
                        throw new WDBException("Create Schema Failed SQL is \n" + sql);
                    })
                );
            };

            execSql();

        });

    }

// ----------------------------------------------------------------------------
// Load the display items from the cache
    isReady() {
        return this.db != null;
    };

// ----------------------------------------------------------------------------
// Load the display items from the cache
    loadFromDispCache(gridKeys, callback) {

        for (let gki = 0; gki < gridKeys.length; ++gki) {
            this.loadGridKey(gridKeys, callback, gridKeys[gki]);
        }

    };

    private  loadGridKey(gridKeys, callback, gridKey) {
        let startTime = new Date();


        //Get all the cars from the database with a select statement,
        // set outputCarList as the callback function for the executeSql command
        this.db.transaction((t) => {
                let qrySql = "SELECT * FROM compiledGrids WHERE gridKey = ? ";
                t.executeSql(qrySql, [gridKey],
                    (transaction, results) => this.processResults(
                        startTime, gridKey, callback, transaction, results
                    ),
                    makeWebSqlErrorHandler(() => {
                        throw new WDBException("Query DB Error");
                    })
                );
            }, makeWebSqlErrorHandler(() => {
                throw new WDBException("Create Transaction Error");
            })
        );

    }

    private processResults(startTime: Date, gridKey, callback, transaction, results) {
        try {
            let compiledGrids = [];

            //Iterate through the results
            for (let i = 0; i < results.rows.length; i++) {
                //Get the current row
                let row = results.rows.item(i);

                let compiledGrid = {
                    gridKey: row.gridKey,
                    blobData: row.blobData,
                    lastUpdate: row.lastUpdate
                };

                compiledGrids.push(compiledGrid);
            }

            let timeTaken = new Date() - startTime;
            console.log(dateStr() + "WebSQL: loadFromDispCache"
                + " took " + timeTaken + "ms (in thread)"
                + " retrieved 1 compiled grids");

            callback([gridKey], compiledGrids);
        } catch (e) {
            this.balloonMsg.showError(e.message);
            console.trace(e);
        }
    }

// ----------------------------------------------------------------------------
// Add disply items to the cache

    updateDispCache(gridsCompiled) {


        if (!gridsCompiled.length)
            return;

        let startTime = new Date();

        let checkItemRetries = (item) => {

            if (item._webSqlRetry == null) {
                item._webSqlRetry = 0

            } else {
                item._webSqlRetry++;
                if (item._webSqlRetry > 5) {
                    this.balloonMsg.showError("Failed to cache new grids");
                    this.balloonMsg.showError("Resetting Peek UI");
                    setTimeout(() => location.reload(), 3000);
                    return false;
                }
            }
            return true;
        }

        if (!checkItemRetries(gridsCompiled))
            return;


        // Run the inserts
        this.db.transaction((t) => {
            for (let i = 0; i < gridsCompiled.length; i++) {
                let compiledGrid = gridsCompiled[i];

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
                    () => {
                        let timeTaken = new Date() - startTime;
                        console.log(dateStr() + "WebSQL: updateDispCache"
                            + " took " + timeTaken + "ms (in thread)"
                            + " Inserted/updated " + gridsCompiled.length + " compiled grids"
                            + " Retries " + compiledGrid._webSqlRetry);
                    },
                    makeWebSqlErrorHandler(
                        (outOfSpaceRetry) => {
                            if (outOfSpaceRetry !== true)
                                throw new WDBException(
                                    "Execute Insert SQL Error");
                            this.updateDispCache([compiledGrid]);
                        }
                    )
                );
            }
        }, makeWebSqlErrorHandler(
            (outOfSpaceRetry) => {
                if (outOfSpaceRetry !== true)
                    throw new WDBException("Create Insert TX Error");
                this.updateDispCache(gridsCompiled);
            }));


    };

}