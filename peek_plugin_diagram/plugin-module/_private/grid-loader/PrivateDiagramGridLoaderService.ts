import {Injectable} from "@angular/core";
import {GridTuple} from "./GridTuple";
import {PrivateDiagramGridLoaderServiceA} from "./PrivateDiagramGridLoaderServiceA";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {
    extend,
    Payload,
    PayloadEnvelope,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageFactoryService,
    TupleStorageServiceABC,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {diagramFilt, gridCacheStorageName} from "../PluginNames";
import {GridUpdateDateTuple} from "./GridUpdateDateTuple";
import {PrivateDiagramTupleService} from "../services";
import {OfflineConfigTuple} from "../tuples";
import {PrivateDiagramGridLoaderStatusTuple} from "./PrivateDiagramGridLoaderStatusTuple";
import {EncodedGridTuple} from "./EncodedGridTuple";


// ----------------------------------------------------------------------------

let clientGridWatchUpdateFromDeviceFilt = extend(
    {"key": "clientGridWatchUpdateFromDevice"},
    diagramFilt
);


// ----------------------------------------------------------------------------

const noSpaceMsg = "there was not enough remaining storage space";

const indexDbNotOpenMsg = "IndexedDB peek_plugin_diagram_grids is not open";

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
export class PrivateDiagramGridLoaderService extends PrivateDiagramGridLoaderServiceA {
    private UPDATE_CHUNK_FETCH_SIZE = 5;
    private SAVE_POINT_ITERATIONS = 1000 / 5; // Every 1000 grids
    private OFFLINE_CHECK_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

    private isReadySubject = new Subject<boolean>();

    private updatesObservable = new Subject<GridTuple[]>();

    private storage: TupleStorageServiceABC;

    // The last set of keys requested from the GridObserver
    private lastWatchedGridKeys: string[] = [];

    // All cached grid dates
    private index: GridUpdateDateTuple = new GridUpdateDateTuple();

    // The queue of grids to cache
    private askServerChunks = [];

    // Saving the cache after each chunk is so expensive, we only do it every 20 or so
    private chunksSavedSinceLastIndexSave = 0;

    private _statusSubject = new Subject<PrivateDiagramGridLoaderStatusTuple>();
    private _status = new PrivateDiagramGridLoaderStatusTuple();

    private offlineConfig: OfflineConfigTuple = new OfflineConfigTuple();

    private readonly RETRIES = 5;

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                private tupleService: PrivateDiagramTupleService,
                storageFactory: TupleStorageFactoryService) {
        super();

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(new TupleSelector(OfflineConfigTuple.tupleName, {}),
                false, false, true)
            .takeUntil(this.onDestroyEvent)
            .filter(v => v.length != 0)
            .subscribe((tuples: OfflineConfigTuple[]) => {
                this.offlineConfig = tuples[0];
                this.askServerForUpdates();
                this._notifyStatus();
            });

        this.storage = storageFactory.create(
            new TupleOfflineStorageNameService(gridCacheStorageName)
        );
        this.storage.open()
            .then(() => this.loadGridCacheIndex())
            .then(() => this.isReadySubject.next(true))
            .catch(e => console.log(`Failed to open grid cache db ${e}`));

        this.setupVortexSubscriptions();
        this._notifyStatus();

        // Check for updates every so often
        Observable.interval(this.OFFLINE_CHECK_PERIOD_MS)
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => this.askServerForUpdates());
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

    statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> {
        return this._statusSubject;
    }

    status(): PrivateDiagramGridLoaderStatusTuple {
        return this._status;
    }

    private _notifyStatus(): void {
        this._status.cacheForOfflineEnabled = this.offlineConfig.cacheChunksForOffline;
        this._status.initialLoadComplete = this.index.initialLoadComplete;

        this._status.loadProgress = Object.keys(this.index.updateDateByChunkKey).length;
        for (let chunk of this.askServerChunks)
            this._status.loadProgress -= Object.keys(chunk).length;

        this._statusSubject.next(this._status);

    }

    private setupVortexSubscriptions(): void {

        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(
            this,
            clientGridWatchUpdateFromDeviceFilt)
            .subscribe((payloadEnvelope: PayloadEnvelope) =>
                this.processGridsFromServer(payloadEnvelope)
            );

        // If the vortex service comes back online, update the watch grids.
        this.vortexStatusService.isOnline
            .filter(isOnline => isOnline == true)
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                this.loadGrids({}, this.lastWatchedGridKeys);
                this.askServerForUpdates();
            });
    }

    private areWeTalkingToTheServer(): boolean {
        return this.offlineConfig.cacheChunksForOffline
            && this.vortexStatusService.snapshot.isOnline;
    }

    /** Cache All Grids
     *
     * Cache all the grids from the server, into this device.
     */
    private askServerForUpdates(): void {
        this._notifyStatus();
        if (!this.areWeTalkingToTheServer()) return;

        // If we're still caching, then exit
        if (this.askServerChunks.length != 0) {
            this.askServerForNextUpdateChunk();
            return;
        }

        let keysNeedingUpdate: string[] = [];
        let total = 0;
        let start = 0;
        let chunkSize = 5000;

        let complete = () => {
            this._status.loadTotal = total;
            this.queueChunksToAskServer(keysNeedingUpdate);
        };

        // This is one big hoop to avoid memory issues on older iOS devices
        let queueNext = () => {
            let ts = new TupleSelector(GridUpdateDateTuple.tupleName, {
                start: start,
                count: start + chunkSize
            });
            start += chunkSize;

            this.tupleService
                .observer
                .pollForTuples(ts)
                .then((tuples: any[]) => {
                    if (!tuples.length) {
                        complete();
                        return;
                    }

                    total += tuples.length;

                    for (let item of tuples) {
                        let chunkKey = item[0];
                        let lastUpdate = item[1];

                        if (!this.index.updateDateByChunkKey.hasOwnProperty(chunkKey)) {
                            this.index.updateDateByChunkKey[chunkKey] = null;
                            keysNeedingUpdate.push(chunkKey);

                        } else if (this.index.updateDateByChunkKey[chunkKey] != lastUpdate) {
                            keysNeedingUpdate.push(chunkKey);
                        }
                    }
                    setTimeout(() => queueNext(), 0);
                })
                .catch(e => console.log(`ERROR in cacheAll : ${e}`));
        };
        queueNext();


    }


    /** Queue Chunks To Ask Server
     *
     */
    private queueChunksToAskServer(keysNeedingUpdate: string[]) {
        if (!this.areWeTalkingToTheServer()) return;

        this.askServerChunks = [];
        this.chunksSavedSinceLastIndexSave = 0;

        let count = 0;
        let indexChunk = {};

        for (let key of keysNeedingUpdate) {
            indexChunk[key] = this.index.updateDateByChunkKey[key];
            count++;

            if (count == this.UPDATE_CHUNK_FETCH_SIZE) {
                this.askServerChunks.push(indexChunk);
                count = 0;
                indexChunk = {};
            }
        }

        if (count)
            this.askServerChunks.push(indexChunk);

        this.askServerForNextUpdateChunk();

        this._status.lastCheck = new Date();
        this._notifyStatus();


    }

    /** Cache Request Next Chunk
     *
     * Request the next chunk of grids from the server
     */
    private askServerForNextUpdateChunk() {
        if (!this.areWeTalkingToTheServer()) return;

        if (this.askServerChunks.length == 0)
            return;

        let nextChunk = this.askServerChunks.pop();

        let payload = new Payload({cacheAll: true}, [nextChunk]);
        extend(payload.filt, clientGridWatchUpdateFromDeviceFilt);
        this.vortexService.sendPayload(payload);

        this._status.lastCheck = new Date();
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
    async loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
                    gridKeys: string[]): Promise<void> {

        for (let i = 0; i < this.RETRIES; i++) {
            try {
                // Query the local storage for the grids we don't have in the cache
                let gridTuples: GridTuple[] = await this.queryStorageGrids(gridKeys);

                // Now that we have the results from the local storage,
                // we can send to the server.
                for (let gridTuple of gridTuples)
                    currentGridUpdateTimes[gridTuple.gridKey] = gridTuple.lastUpdate;

                this.sendWatchedGridsToServer(currentGridUpdateTimes);
                return;

            } catch (err) {
                console.log(`GridCache.storeGridTuples: ${err}`);
                if (!this.retry(err.message))
                    return;
            }
        }

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
    private processGridsFromServer(payloadEnvelope: PayloadEnvelope) {
        payloadEnvelope.decodePayload()
            .then((payload: Payload) => {
                let encodedGridTuples: EncodedGridTuple[] = <EncodedGridTuple[]>payload.tuples;

                let isCacheAll = payload.filt["cacheAll"] === true;

                if (!isCacheAll) {
                    this.emitEncodedGridTuples(encodedGridTuples)
                }

                // We always cache the tuples
                let promise: any = this.storeGridTuples(encodedGridTuples)
                    .then(() => {
                        if (!isCacheAll)
                            return;

                        this.chunksSavedSinceLastIndexSave++;

                        if (this.askServerChunks.length == 0) {
                            this.saveGridCacheIndex(true);
                            this.index.initialLoadComplete = true;

                        } else {
                            this.saveGridCacheIndex();
                            this.askServerForNextUpdateChunk();

                        }
                        this._notifyStatus();
                    });
                return promise;
            })
            .catch(e => `ERROR GridLoader.processGridsFromServer: ${e}`);
    }

    private emitEncodedGridTuples(encodedGridTuples: EncodedGridTuple[]): void {

        let promises: Promise<void>[] = [];
        let gridTuples: GridTuple[] = [];

        for (let encodedGridTuple of encodedGridTuples) {
            if (encodedGridTuple.encodedGridTuple == null) {
                // Add an empty grid
                const gridTuple = new GridTuple();
                gridTuple.gridKey = encodedGridTuple.gridKey;
                gridTuple.dispJsonStr = null;
                gridTuple.lastUpdate = null;
                gridTuples.push(gridTuple);
                promises.push(Promise.resolve());
            } else {
                let promise: any = Payload.fromEncodedPayload(encodedGridTuple.encodedGridTuple)
                    .then((payload: Payload) => {
                        gridTuples.push(payload.tuples[0]);
                    })
                    .catch((err) => {
                        console.log(`GridLoader.emitEncodedGridTuples decode error: ${err}`);
                    });
                promises.push(promise);
            }
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
    private storeGridTuples(encodedGridTuples: EncodedGridTuple[], retries = 0): Promise<void> {
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

                    if (encodedGridTuple.encodedGridTuple == null) {
                        delete this.index.updateDateByChunkKey[encodedGridTuple.gridKey];
                        promises.push(
                            tx.deleteTuples(
                                new GridKeyTupleSelector(encodedGridTuple.gridKey)
                            )
                        );

                    } else {
                        this.index.updateDateByChunkKey[encodedGridTuple.gridKey]
                            = encodedGridTuple.lastUpdate;

                        promises.push(
                            tx.saveTuplesEncoded(
                                new GridKeyTupleSelector(encodedGridTuple.gridKey),
                                encodedGridTuple.encodedGridTuple
                            )
                        );

                    }
                }

                return Promise.all(promises)
                    .then(() => this.saveGridCacheIndex(false, tx))
                    .then(() => tx.close())
                    .catch(err => {
                        console.log(`GridCache.storeGridTuples: ${err}`);
                        if (retries < this.RETRIES && this.retry(err.message))
                            return this.storeGridTuples(encodedGridTuples, retries++);
                    });
            });
        return retPromise;
    }

    private retry(message: string): boolean {
        if (message.indexOf(noSpaceMsg) !== -1)
            return true;

        return (message.indexOf(indexDbNotOpenMsg) !== -1);
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
                    new TupleSelector(GridUpdateDateTuple.tupleName, {})
                )
                    .then((tuples: GridUpdateDateTuple[]) => {
                        // Length should be 0 or 1
                        if (tuples.length)
                            this.index = tuples[0];
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

        if (this.chunksSavedSinceLastIndexSave <= this.SAVE_POINT_ITERATIONS && !force)
            return Promise.resolve();

        let ts = new TupleSelector(GridUpdateDateTuple.tupleName, {});
        let tuples = [this.index];
        let errCb = (e) => console.log(`GridCache.storeGridCacheIndex: ${e}`);

        this.chunksSavedSinceLastIndexSave = 0;

        if (transaction != null)
            return transaction.saveTuples(ts, tuples)
                .catch(errCb);

        return this.storage.transaction(true)
            .then((tx) => tx.saveTuples(ts, tuples))
            .catch(errCb);
    }

}
