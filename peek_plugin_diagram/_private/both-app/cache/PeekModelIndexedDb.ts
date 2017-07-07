import {dateStr} from "../DiagramUtil";
import { VortexService} from "@synerty/vortexjs";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";

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

class IDBException {
    constructor(public message: string) {
    }

    toString() {
        return 'IndexedDB : IDBException: ' + this.message;
    }
}

function addIndexedDbHandlers(request, stacktraceFunctor) {
    request.onerror = (request) => {
        console.log(dateStr() + "IndexedDB : ERROR " + request.target.error);
        this.balloonMsg.showError("IndexedDB : ERROR " + request.target.error);
        stacktraceFunctor();
    };

    request.onabort = (request) => {
        console.log(dateStr() + "IndexedDB : ABORT " + request.target.error);
        this.balloonMsg.showError("IndexedDB : ABORT " + request.target.error);
        stacktraceFunctor();
    };

    request.onblock = (request) => {
        console.log(dateStr() + "IndexedDB : BLOCKED " + request.target.error);
        this.balloonMsg.showError("IndexedDB : BLOCKED " + request.target.error);
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
export class PeekModelIndexedDb {
    name = "IndexedDB";
    db: any;

    private GRID_STORE = "grid";
    private GRID_STORE_INDEX = "gridIndex";

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private vortexService:VortexService) {


        // DISP Store

        let request = window.indexedDB.open("peek", 1);
        addIndexedDbHandlers(request, function () {
            throw new IDBException("DB Open");
        });


        request.onsuccess = (event) => {
            console.log(dateStr() + "Success opening DB");
            this.db = event.target.result;
        };

        request.onupgradeneeded = (event) => {
            console.log(dateStr() + "IndexedDB : Upgrading");
            this.db = event.target.result;

            // SCHEMA for database points
            let gridStore = this.db.createObjectStore(this.GRID_STORE,
                {keyPath: "gridKey"});

            console.log(dateStr() + "IndexedDB : Upgrade Success");

        };
    }

// ----------------------------------------------------------------------------
// Load the display items from the cache
    isReady() {

        return this.db != null;
    };

// ----------------------------------------------------------------------------
// Load the display items from the cache
    loadFromDispCache(gridKeys, callback) {


        // Now put the data.
        let tx = this.db.transaction(this.GRID_STORE, "readonly");
        let store = tx.objectStore(this.GRID_STORE);

        function loadGridKey(gridKey) {
            let startTime = new Date();

            let request = store.get(gridKey);
            addIndexedDbHandlers(request, function () {
                throw new IDBException("Index open cursor")
            });

            request.onsuccess = () => {

                let compiledGrids = [];

                let timeTaken = new Date() - startTime;
                console.log(dateStr() + "IndexedDB: loadFromDispCache"
                    + " took " + timeTaken + "ms (in thread)");

                // Called for each matching record
                let data = request.result;
                if (data) {
                    compiledGrids.push(data);
                }

                callback([gridKey], compiledGrids);
            };
        }

        for (let gki = 0; gki < gridKeys.length; ++gki) {
            loadGridKey(gridKeys[gki]);
        }

    };


// ----------------------------------------------------------------------------
// Add disply items to the cache

    updateDispCache(gridsCompiled) {


        if (!gridsCompiled.length)
            return;

        let startTime = new Date();

        return new Promise(function (resolve, reject) {

            let tx = this.db.transaction(this.GRID_STORE, "readwrite");
            addIndexedDbHandlers(tx, function () {
                throw new IDBException("Transaction error");
                reject();
            });

            tx.oncomplete = () => {
                let timeTaken = new Date() - startTime;
                console.log(dateStr() + "IndexedDB: updateDispCache"
                    + " took " + timeTaken + "ms (in thread)"
                    + " Inserted/updated " + gridsCompiled.length + " compiled grids");
                resolve();
            }

            let store = tx.objectStore(this.GRID_STORE);

            // Run the inserts
            for (let i = 0; i < gridsCompiled.length; i++) {
                store.put(gridsCompiled[i]);
            }
        });


    };

}