import {dateStr} from "../DiagramUtil";

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
export class PeekModelNoopDb {

    name = "No";

    constructor() {
    }

// ----------------------------------------------------------------------------
// Load the display items from the cache
    isReady() {
        return true;
    };

// ----------------------------------------------------------------------------
// Load the display items from the cache
    loadFromDispCache(gridKeys, callback) {

        for (let gki = 0; gki < gridKeys.length; ++gki) {
            let gridKey = gridKeys[gki];
            setTimeout(function () {
                console.log(dateStr() + "NoopDB: loadFromDispCache"
                    + " passed back grid key " + gridKey);

                callback([gridKey], []);

            }, 1);
        }
    };

// ----------------------------------------------------------------------------
// Add disply items to the cache

    updateDispCache(gridsCompiled) {
        // Noop storage has no data
    };

}