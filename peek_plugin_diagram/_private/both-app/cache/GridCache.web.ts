import {Injectable} from "@angular/core";
import {PrivateDiagramLookupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService";
import {LinkedGrid} from "./LinkedGrid.web";
import {
    GridTuple,
    PrivateDiagramGridLoaderServiceA
} from "@peek/peek_plugin_diagram/_private/grid-loader";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {dictValuesFromObject} from "../DiagramUtil";


// ----------------------------------------------------------------------------

class Cache {

    private cache: { [gridKey: string]: LinkedGrid } = {};

    put(grid: LinkedGrid): void {
        this.cache[grid.gridKey] = grid;
    }

    get(gridKey: string): null | LinkedGrid {
        if (!this.has(gridKey))
            return null;
        return this.cache[gridKey];
    }

    del(gridKey: string): void {
        delete this.cache[gridKey];
    }

    has(gridKey: string): boolean {
        return this.cache.hasOwnProperty(gridKey);
    }

    get grids(): LinkedGrid[] {
        const grids = [];
        for (const gridKey of Object.keys(this.cache)) {
            grids.push(this.cache[gridKey]);
        }
        return grids;
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
 * 3) Poll for grids from the grid loader
 *
 */
@Injectable()
export class GridCache {

    private updatesObservable = new Subject<LinkedGrid>();

    // This is the last X number of caches.
    // We will cache the last 20 sets of watched grids in these caches
    // Over 20, will just fall out of scope and be garbage collected
    private cacheQueue: Cache[] = [];
    private MAX_CACHE = 50;

    // TODO, There appears to be no way to tear down a service
    private lifecycleEmitter = new ComponentLifecycleEventEmitter();

    constructor(private lookupService: PrivateDiagramLookupService,
                private gridLoader: PrivateDiagramGridLoaderServiceA) {


        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.gridLoader.observable
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe((tuples: GridTuple[]) => this.processGridUpdates(tuples));

        // If the lookups reload, we need to relink all the disps
        this.lookupService.dispsNeedRelinkingObservable()
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe(() => {
                for (const cache of this.cacheQueue) {
                    for (const linkedGrid of cache.grids) {
                        for (const disp of linkedGrid.disps) {
                            lookupService._linkDispLookups(disp);
                        }
                    }
                }
            });

    }

    isReady(): boolean {
        return this.gridLoader.isReady();
    }

    get observable(): Observable<LinkedGrid> {
        return this.updatesObservable;
    }


    /** Update Watched Grids
     *
     * Change the list of grids that the GridObserver is interested in.
     */
    updateWatchedGrids(gridKeys: string[], forceCacheFlush = false): void {
        if (forceCacheFlush) {
            this.cacheQueue = [];
        }

        this.gridLoader.watchGrids(gridKeys);

        // Rotate the grid cache
        let latestCache = this.rotateCache(gridKeys);

        // Get the grids and notify the observer
        for (let linkedGrid of dictValuesFromObject(latestCache))
            this.updatesObservable.next(linkedGrid);


        // This is the list of grids we don't have in the cache and we should
        // as the local storage for
        let gridsToGetFromStorage = [];

        // Create the grid list for the server, we include the dates so it doesn't
        // send us stuff we already have.
        let updateTimeByGridKey: { [gridKey: string]: string } = {};
        for (let gridKey of gridKeys) {
            let grid = latestCache.get(gridKey);
            updateTimeByGridKey[gridKey] = grid == null ? null : grid.lastUpdate;

            if (grid == null)
                gridsToGetFromStorage.push(gridKey);
        }

        // Query the local storage for the grids we don't have in the cache
        this.gridLoader.loadGrids(updateTimeByGridKey, gridsToGetFromStorage);


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


    /** Process Grid Updates
     *
     */
    private processGridUpdates(gridTuples: GridTuple[]) {
        let latestCache = this.cacheQueue[0];

        for (let gridTuple of gridTuples) {
            let cachedLinkedGrid = latestCache[gridTuple.gridKey];

            // If the cache differs, ignore the update
            // This really shouldn't happen.
            if (cachedLinkedGrid != null
                && cachedLinkedGrid.lastUpdate == gridTuple.lastUpdate) {
                continue
            }

            // 1) Link the grid
            let linkedGrid = new LinkedGrid(gridTuple, this.lookupService);

            // 2) Cache the grid
            latestCache.put(linkedGrid);

            // 3) Notify the observer
            this.updatesObservable.next(linkedGrid);
        }

    }

}