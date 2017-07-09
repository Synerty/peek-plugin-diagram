import {Injectable} from "@angular/core";
import {LookupCache} from "./LookupCache";
import {LinkedGrid} from "./LinkedGrid";
import {Subject} from "rxjs/Subject";
import {GridTuple} from "../tuples/GridTuple";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageFactoryService,
    TupleStorageServiceABC,
    VortexService
} from "@synerty/vortexjs";
import {diagramFilt, gridCacheStorageName} from "@peek/peek_plugin_diagram/_private";

import * as moment from "moment";
import {dictValuesFromObject} from "../DiagramUtil";

// ----------------------------------------------------------------------------

let clientGridWatchUpdateFromDeviceFilt = extend(
    {'key': "clientGridWatchUpdateFromDevice"},
    diagramFilt
);

// ----------------------------------------------------------------------------

/** Grid Key Tuple Selector
 *
 * We're using or own storage database, seprate from the typical
 * offline tuple storage. And we're only going to store grids in id.
 *
 * Because of this, we'll extend tuple selector to only return the grid key
 * instead of it's normal ordered tuplename, {} selector.
 *
 * We only need to convert from this class to string, the revers will attemp
 * to convert it back to a real TupleSelector
 *
 * In summary, this is a hack to avoid a little unnesasary bulk.
 */
class GridKeyTupleSelector extends TupleSelector {
    constructor(gridKey: string) {
        super(gridKey, {});
    }

    /** To Ordered Json Str (Override)
     *
     * This method is used by the Tuple Storage to generate the DB Primary Key
     */
    toOrderedJsonStr(): string {
        return this.name;
    }
}


// ----------------------------------------------------------------------------

class Cache {

    private cache: { [gridKey: string]: LinkedGrid } = {};

    put(grid: LinkedGrid): void {
        this.cache[grid.gridKey] = grid;
    }

    get(gridKey: string): null | LinkedGrid {
        if (!)
            return null;
        return this.cache[gridKey];
    }

    del(gridKey: string): void {
        delete this.cache[gridKey];
    }

    has(gridKey: string): boolean {
        return this.cache.hasOwnProperty(gridKey);
    }
}

// ----------------------------------------------------------------------------
/** Grid Cache
 *
 * This class has the following responsibilities:
 *
 * 1) Keep and manage an in memory dict of grids.
 *
 * 2) Provide updates to the GridObservable class as grid updates come in.
 *
 * 3) Poll for grids from the local storage (IndexedDB or WebSQL), and:
 * 3.1) Update the cache
 *
 * 4) Poll for grids from the server and:
 * 4.1) Store these back into the local storage
 * 4.2) Update the cache
 *
 */
@Injectable()
export class GridCache {

    private updatesObservable = new Subject<LinkedGrid>();

    // This is the last X number of caches.
    // We will cache the last 20 sets of watched grids in these caches
    // Over 20, will just fall out of scope and be garbage collected
    private cacheQueue: Cache[] = [];
    private MAX_CACHE = 20;

    private storage: TupleStorageServiceABC;

    constructor(private lookupCache: LookupCache,
                private vortexService: VortexService,
                storageFactory: TupleStorageFactoryService) {
        this.storage = storageFactory.create(
            new TupleOfflineStorageNameService(gridCacheStorageName)
        );


        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(
            new ComponentLifecycleEventEmitter(),
            clientGridWatchUpdateFromDeviceFilt)
            .subscribe((payload: Payload) => this.processGridsFromServer(payload));
    }

    get
    observable(): Subject<LinkedGrid> {
        return this.updatesObservable;
    }

    /** Update Watched Grids
     *
     * Change the list of grids that the GridObserver is interested in.
     */
    updateWatchedGrids(gridKeys: string[]): void {

        // Rotate the grid cache
        let latestCache = this.rotateCache(gridKeys);

        // Get the grids and notify the observer
        for (let linkedGrid of dictValuesFromObject(latestCache))
            this.observable.next(linkedGrid);


        // This is the list of grids we don't have in the cache and we should
        // as the local storage for
        let gridsToGetFromStorage = [];

        // Create the grid list for the server, we include the dates so it doesn't
        // send us stuff we already have.
        let updateTimeByGridKey: { [gridKey: string]: Date } = {};
        for (let gridKey of gridKeys) {
            let grid = latestCache.get(gridKey);
            updateTimeByGridKey[gridKey] = grid == null ? null : grid.lastUpdate;

            if (grid == null)
                gridsToGetFromStorage.push(gridKey);
        }

        // Query the local storage for the grids we don't have in the cache
        this.queryStorageGrids(gridsToGetFromStorage)
            .then((gridTuples: GridTuple[]) => {
                // Now that we have the results from the local storage,
                // we can send to the server.
                for (let gridTuple of gridTuples)
                    updateTimeByGridKey[gridTuple.gridKey] = gridTuple.lastUpdate;
                this.sendWatchedGridsToServer(updateTimeByGridKey);
            });


    }

    /** Rotate Cache
     *
     * Instead of managing a pool of objects and determining how long they have been
     * in memory, We'll do this another way.
     *
     * We'll have X number of cache indexes, and the oldest cache drops off the
     * the queue. When this happens the garbage collector will clean it up.
     *
     * The overhead is this code and X dict objects.
     */
    private rotateCache(gridKeys: string[]): Cache {
        // Create the latest cache
        let latestCache = new Cache();

        // Populate the latest cache with any grids in previos caches
        for (let gridKey of gridKeys) {
            for (let cache of this.cacheQueue) {
                let found = false;
                if (!found) {
                    let thisLinkedGrid = cache.get(gridKey);
                    // We're iterating the caches from newest to oldest
                    // So we can stop on first hit.
                    if (thisLinkedGrid != null) {
                        latestCache[gridKey] = thisLinkedGrid;
                        found = true;
                    }
                }

                // Delete the grid from the older cache.
                cache.del(gridKey);
            }
        }

        // Push the latest cache to the front of the queue
        this.cacheQueue.unshift(latestCache);

        // Trim the cache
        while (this.cacheQueue.length > this.MAX_CACHE)
            this.cacheQueue.pop();

        // Return the latest cache
        return latestCache;
    }


    //
    private sendWatchedGridsToServer(updateTimeByGridKey: { [gridKey: string]: Date }) {
        let payload = Payload(clientGridWatchUpdateFromDeviceFilt);
        payload.tuples = <any[]>updateTimeByGridKey;
        this.vortexService.sendPayload(payload);
    }


    /** Process Grids From Server
     *
     * Process the grids the server has sent us.
     */
    private processGridsFromServer(payload: Payload) {
        let gridTuples: GridTuple[] = <GridTuple[]>payload.tuples;
        this.processGridUpdates(gridTuples);
        this.storeGridTuples(gridTuples);
    }

    /** Query Storage Grids
     *
     * Load grids from local storage if they exist in it.
     *
     */
    private queryStorageGrids(gridKeys: string[]): Promise<GridTuple[]> {
        let tx = this.storage.transaction(false);

        let promises = [];
        //noinspection JSMismatchedCollectionQueryUpdate
        let gridTuples: GridTuple[];

        for (let gridKey of gridKeys) {
            promises.push(
                tx.loadTuples(new GridKeyTupleSelector(gridKey))
                    .then((grids: GridTuple[]) => {
                        // Length should be 0 or 1
                        if (!grids.length)
                            return;
                        gridTuples.push(grids[0]);
                        this.processGridUpdates(grids);
                    })
            );
        }

        return Promise.all(promises)
            .then(() => {
                // Asynchronously close the transaction
                tx.close()
                    .catch(e => console.log(`GridCache.queryStorageGrids commit:${e}`));
                // Return the grid tuples.
                return gridTuples;
            })
            .catch(e => console.log(`GridCache.queryStorageGrids: ${e}`));

    }

    /** Process Grid Updates
     *
     */
    private processGridUpdates(gridTuples: GridTuple[]) {
        let latestCache = this.cacheQueue[0];

        for (let gridTuple of gridTuples) {
            let cachedLinkedGrid = latestCache[gridTuple.gridKey];

            // If the cache is newer, ignore the update
            // This really shouldn't happen.
            if (cachedLinkedGrid != null
                && moment(cachedLinkedGrid.lastUpdate).isBefore(gridTuple.lastUpdate)) {
                continue
            }

            // Else

            // 1) Link the grid
            let linkedGrid = new LinkedGrid(gridTuple, this.lookupCache);

            // 2) Cache the grid
            latestCache.put(linkedGrid);

            // 3) Notify the observer
            this.updatesObservable.next(linkedGrid);
        }

    }

    /** Store Grid Tuples
     * This is called with grids from the server, store them for later.
     */
    private storeGridTuples(gridTuples: GridTuple[]): Promise<void> {
        let tx = this.storage.transaction(true);

        let promises = [];

        for (let gridTuple of gridTuples) {
            promises.push(
                tx.storeTuples(new GridKeyTupleSelector(gridTuple.gridKey), [gridTuple])
            );
        }

        return Promise.all(promises)
            .then(() => tx.close())
            .catch(e => console.log(`GridCache.storeGridTuples: ${e}`));
    }

}