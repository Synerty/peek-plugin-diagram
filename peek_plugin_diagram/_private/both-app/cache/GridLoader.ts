import { Injectable } from "@angular/core";
import { GridTuple } from "../tuples/GridTuple";
import { EncodedGridTuple } from "../tuples/EncodedGridTuple";
import { Observable, Subject } from "rxjs";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageFactoryService,
    TupleStorageServiceABC,
    VortexService,
    VortexStatusService,
    Tuple,
    addTupleType
} from "@synerty/vortexjs";


import { FooterService } from "@synerty/peek-util";
import { diagramFilt, gridCacheStorageName } from "@peek/peek_plugin_diagram/_private";
import { GridCacheIndexTuple } from "../tuples/GridCacheIndexTuple";
import {
    PrivateDiagramTupleService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";



// ----------------------------------------------------------------------------

let clientGridWatchUpdateFromDeviceFilt = extend(
    { 'key': "clientGridWatchUpdateFromDevice" },
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

export abstract class GridLoaderA {
    constructor() {

    }

    abstract isReady(): boolean;

    abstract isReadyObservable(): Observable<boolean>;

    abstract observable: Observable<GridTuple[]>;

    abstract cacheAll(): void;

    abstract watchGrids(gridKeys: string[]): void;

    abstract loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
        gridKeys: string[]): void;

}


// ----------------------------------------------------------------------------
/** Grid Cache
 *
 * This class has the following responsibilities:
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
export class GridLoader extends GridLoaderA {

    private isReadySubject = new Subject<boolean>();

    private updatesObservable = new Subject<GridTuple[]>();

    private storage: TupleStorageServiceABC;

    // TODO, There appears to be no way to tear down a service
    private lifecycleEmitter = new ComponentLifecycleEventEmitter();

    // The last set of keys requested from the GridObserver
    private lastWatchedGridKeys: string[] = [];

    // All cached grid dates
    private gridCacheIndex: GridCacheIndexTuple = new GridCacheIndexTuple();

    // The queue of grids to cache
    private cacheGridQueueChunks = [];

    // Saving the cache after each chunk is so expensive, we only do it every 20 or so
    private chunksSavedSinceLastIndexSave = 0;

    constructor(private footerService: FooterService,
        private vortexService: VortexService,
        private vortexStatusService: VortexStatusService,
        private tupleService: PrivateDiagramTupleService,
        storageFactory: TupleStorageFactoryService) {
        super();

        this.storage = storageFactory.create(
            new TupleOfflineStorageNameService(gridCacheStorageName)
        );
        this.storage.open()
            .then(() => this.loadGridCacheIndex())
            .then(() => this.isReadySubject.next(true))
            .catch(e => console.log(`Failed to open grid cache db ${e}`));

        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(
            this.lifecycleEmitter,
            clientGridWatchUpdateFromDeviceFilt)
            .subscribe((payload: Payload) => this.processGridsFromServer(payload));

        // If the vortex service comes back online, update the watch grids.
        this.vortexStatusService.isOnline
            .filter(isOnline => isOnline == true)
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe(() => this.loadGrids({}, this.lastWatchedGridKeys));
    }

    isReady(): boolean {
        return this.storage.isOpen();
    }

    isReadyObservable(): Observable<boolean> {
        return this.isReadySubject;
    }

    get observable(): Observable<GridTuple[]> {
        return this.updatesObservable;
    }

    /** Cache All Grids
     *
     * Cache all the grids from the server, into this device.
     */
    cacheAll(): void {
        // There is no point talking to the server if it's offline
        if (!this.vortexStatusService.snapshot.isOnline)
            return;
        
        this.footerService.setStatusText(`Starting Cache Update`);

        this.tupleService
            .tupleObserver
            .pollForTuples(new TupleSelector(GridCacheIndexTuple.tupleName, {}))
            .then((tuples: GridCacheIndexTuple[]) => {
                if (!tuples.length)
                    return;

                let index = tuples[0];
                // Break the grids to cache down into chunks
                let allChunks = [];
                let count = 0;
                let thisChunk = {};

                for (let key in index.data) {
                    if (!index.data.hasOwnProperty(key))
                        continue;

                    let serverDate = index.data[key];

                    // Make sure we have the right dates for our index if it exists
                    let ourCacheDate = this.gridCacheIndex.data[key];
                    if (ourCacheDate == null) {
                        // We havn't cached this grid at all, add it to the queue
                        thisChunk[key] = null;
                        count += 1;

                    } else if (ourCacheDate != serverDate) {
                        // We have this grid, but it's out of date
                        thisChunk[key] = ourCacheDate;
                        count += 1;
                    } // ELSE, we're all good.

                    if (count == 15) {
                        allChunks.push(thisChunk);
                        count = 0;
                        thisChunk = {};
                    }
                }
                if (count)
                    allChunks.push(thisChunk);

                this.cacheGridQueueChunks = allChunks;

                console.log(`Cacheing ${this.cacheGridQueueChunks.length} grid chunks`);
                this.cacheRequestNextChunk();

            })
            .catch(e => console.log(`ERROR in cacheAll : ${e}`));


    }

    /** Cache Request Next Chunk
     *
     * Request the next chunk of grids from the server
     */
    private cacheRequestNextChunk() {
        this.chunksSavedSinceLastIndexSave++;

        if (this.cacheGridQueueChunks.length == 0) {
            this.footerService.setStatusText(`Caching Complete`);
            this.saveGridCacheIndex(true);
            return;
        }

        this.saveGridCacheIndex();

        this.footerService.setStatusText(`${this.cacheGridQueueChunks.length} grids left`);

        console.log(`Cacheing next grid chunk, ${this.cacheGridQueueChunks.length} remaining`);

        let nextChunk = this.cacheGridQueueChunks.pop();

        let payload = new Payload(
            extend({ cacheAll: true }, clientGridWatchUpdateFromDeviceFilt)
        );
        payload.tuples = [nextChunk];
        this.vortexService.sendPayload(payload);
    }

    /** Update Watched Grids
     *
     * Change the list of grids that the GridObserver is interested in.
     */
    watchGrids(gridKeys: string[]): void {
        this.lastWatchedGridKeys = gridKeys;
    }

    /** Update Watched Grids
     *
     * Change the list of grids that the GridObserver is interested in.
     */
    loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
        gridKeys: string[]): void {

        // Query the local storage for the grids we don't have in the cache
        this.queryStorageGrids(gridKeys)
            .then((gridTuples: GridTuple[]) => {
                // Now that we have the results from the local storage,
                // we can send to the server.
                for (let gridTuple of gridTuples)
                    currentGridUpdateTimes[gridTuple.gridKey] = gridTuple.lastUpdate;

                this.sendWatchedGridsToServer(currentGridUpdateTimes);
            });
    }

    //
    private sendWatchedGridsToServer(updateTimeByGridKey: { [gridKey: string]: string }) {
        // There is no point talking to the server if it's offline
        if (!this.vortexStatusService.snapshot.isOnline)
            return;

        let payload = new Payload(clientGridWatchUpdateFromDeviceFilt);
        payload.tuples = [updateTimeByGridKey];
        this.vortexService.sendPayload(payload);
    }


    /** Process Grids From Server
     *
     * Process the grids the server has sent us.
     */
    private processGridsFromServer(payload: Payload) {
        let encodedGridTuples: EncodedGridTuple[] = <EncodedGridTuple[]>payload.tuples;

        let isCacheAll = payload.filt["cacheAll"] === true;

        if (!isCacheAll) {
            this.emitEncodedGridTuples(encodedGridTuples)
        }

        this.storeGridTuples(encodedGridTuples)
            .then(() => isCacheAll && this.cacheRequestNextChunk());

    }

    private emitEncodedGridTuples(encodedGridTuples: EncodedGridTuple[]): void {

        let promises: Promise<void>[] = [];
        let gridTuples: GridTuple[] = [];

        for (let encodedGridTuple of encodedGridTuples) {
            let promise: any = Payload.fromVortexMsg(encodedGridTuple.encodedGridTuple)
                .then((payload: Payload) => {
                    gridTuples.push(payload.tuples[0]);
                })
                .catch((err) => {
                    console.log(`GridLoader.emitEncodedGridTuples decode error: ${err}`);
                });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(() => {
                this.updatesObservable.next(gridTuples);
            })
            .catch((err) => {
                console.log(`GridLoader.emitEncodedGridTuples all error: ${err}`);
            });

    }

    /** Query Storage Grids
     *
     * Load grids from local storage if they exist in it.
     *
     */
    private queryStorageGrids(gridKeys: string[]): Promise<GridTuple[]> {
        let retPromise: any = this.storage.transaction(false)
            .then((tx) => {
                let promises = [];
                //noinspection JSMismatchedCollectionQueryUpdate
                let gridTuples: GridTuple[] = [];

                for (let gridKey of gridKeys) {
                    promises.push(
                        tx.loadTuples(new GridKeyTupleSelector(gridKey))
                            .then((grids: GridTuple[]) => {
                                // Length should be 0 or 1
                                if (!grids.length)
                                    return;
                                gridTuples.push(grids[0]);
                                this.updatesObservable.next(grids);
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
                    });
            });
        return retPromise;

    }


    /** Store Grid Tuples
     * This is called with grids from the server, store them for later.
     */
    private storeGridTuples(encodedGridTuples: EncodedGridTuple[]): Promise<void> {
        if (encodedGridTuples.length == 0) {
            return Promise.resolve();
        }

        let gridKeys = [];
        for (let encodedGridTuple of encodedGridTuples) {
            gridKeys.push(encodedGridTuple.gridKey);
        }
        console.log(`Caching grids ${gridKeys}`);

        let retPromise: any = this.storage.transaction(true)
            .then((tx) => {

                let promises = [];

                for (let encodedGridTuple of encodedGridTuples) {
                    this.gridCacheIndex.data[encodedGridTuple.gridKey]
                        = encodedGridTuple.lastUpdate;
                    promises.push(
                        tx.saveTuplesEncoded(
                            new GridKeyTupleSelector(encodedGridTuple.gridKey),
                            encodedGridTuple.encodedGridTuple
                        )
                    );
                }

                return Promise.all(promises)
                    .then(() => this.saveGridCacheIndex(false, tx))
                    .then(() => tx.close())
                    .catch(e => console.log(`GridCache.storeGridTuples: ${e}`));
            });
        return retPromise;
    }


    /** Load Grid Cache Index
     *
     * Loads the running tab of the update dates of the cached grids
     *
     */
    private loadGridCacheIndex(): Promise<void> {
        let retPromise: any = this.storage.transaction(false)
            .then((tx) => {
                return tx.loadTuples(
                    new TupleSelector(GridCacheIndexTuple.tupleName, {})
                )
                    .then((tuples: GridCacheIndexTuple[]) => {
                        // Length should be 0 or 1
                        if (tuples.length)
                            this.gridCacheIndex = tuples[0];
                    })
            });
        return retPromise;
    }


    /** Store Grid Cache Index
     *
     * Updates our running tab of the update dates of the cached grids
     *
     */

    private saveGridCacheIndex(force = false, transaction = null): Promise<void> {

        if (this.chunksSavedSinceLastIndexSave <= 20 && !force)
            return Promise.resolve();

        let ts = new TupleSelector(GridCacheIndexTuple.tupleName, {});
        let tuples = [this.gridCacheIndex];
        let errCb = (e) => console.log(`GridCache.storeGridCacheIndex: ${e}`)

        this.chunksSavedSinceLastIndexSave = 0;

        if (transaction != null)
            return transaction.saveTuples(ts, tuples)
                .catch(errCb);

        return this.storage.transaction(true)
            .then((tx) => tx.saveTuples(ts, tuples))
            .catch(errCb);
    }

}