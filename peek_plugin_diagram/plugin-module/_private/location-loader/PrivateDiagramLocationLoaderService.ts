import {Injectable} from "@angular/core";
import {LocationIndexTuple} from "./LocationIndexTuple";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
    PayloadEnvelope,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService,
    TupleSelector,
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {
    diagramFilt,
    locationIndexCacheStorageName
} from "@peek/peek_plugin_diagram/_private";


import {LocationIndexUpdateDateTuple} from "./LocationIndexUpdateDateTuple";
import {DispKeyLocationTuple} from "./DispKeyLocationTuple";
import {PrivateDiagramCoordSetService} from "../services/PrivateDiagramCoordSetService";

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {EncodedLocationIndexTuple} from "./EncodedLocationIndexTuple";
import {PrivateDiagramLocationLoaderStatusTuple} from "./PrivateDiagramLocationLoaderStatusTuple";
import {PrivateDiagramTupleService} from "../services/PrivateDiagramTupleService";
import {OfflineConfigTuple} from "../tuples";

let pako = require("pako");


// ----------------------------------------------------------------------------

let clientLocationIndexWatchUpdateFromDeviceFilt = extend(
    {'key': "clientLocationIndexWatchUpdateFromDevice"},
    diagramFilt
);

// ----------------------------------------------------------------------------
/** LocationIndexTupleSelector
 */
class LocationIndexTupleSelector extends TupleSelector {
    constructor(indexBucket: string) {
        super(LocationIndexTuple.tupleName, {key: indexBucket});
    }
}

// ----------------------------------------------------------------------------
/** LastUpdateTupleSelector
 */
class UpdateDateTupleSelector extends TupleSelector {
    constructor() {
        super(LocationIndexUpdateDateTuple.tupleName, {});
    }
}


// ----------------------------------------------------------------------------
/** hash method
 */
let BUCKET_COUNT = 1024;

function dispKeyHashBucket(modelSetKey: string, dispKey: string): string {
    /** Disp Key Hash Bucket

     This method create an int from 0 to 255, representing the hash bucket for this
     key.

     This is simple, and provides a reasonable distribution

     @param modelSetKey:
     @param dispKey:

     @return:

     */
    if (modelSetKey == null || modelSetKey.length == 0)
        throw new Error("modelSetkey is None or zero length");

    if (dispKey == null || dispKey.length == 0)
        throw new Error("dispKey is None or zero length");

    let hash = 0;

    for (let i = 0; i < dispKey.length; i++) {
        hash = ((hash << 5) - hash) + dispKey.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    hash = hash & (BUCKET_COUNT - 1); // 1024 buckets

    return `${modelSetKey}:${hash}`;
}


// ----------------------------------------------------------------------------
/** PrivateDiagramLocationLoaderService Cache
 *
 * This class has the following responsibilities:
 *
 * 1) Maintain a local storage of the index
 *
 * 2) Return DispKey locations based on the index.
 *
 */
@Injectable()
export class PrivateDiagramLocationLoaderService extends ComponentLifecycleEventEmitter {

    private index = new LocationIndexUpdateDateTuple();

    private lifecycleEmitter = new ComponentLifecycleEventEmitter();

    private _hasLoaded = false;
    private _hasLoadedSubject = new Subject<void>();

    private storage: TupleOfflineStorageService;

    private _statusSubject = new Subject<PrivateDiagramLocationLoaderStatusTuple>();
    private _status = new PrivateDiagramLocationLoaderStatusTuple();

    private offlineConfig: OfflineConfigTuple = new OfflineConfigTuple();

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService,
                private coordSetService: PrivateDiagramCoordSetService,
                private tupleService: PrivateDiagramTupleService) {
        super();

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(new TupleSelector(OfflineConfigTuple.tupleName, {}),
                false, false, true)
            .takeUntil(this.onDestroyEvent)
            .filter(v => v.length != 0)
            .subscribe((tuples: OfflineConfigTuple[]) => {
                this.offlineConfig = tuples[0];
                if (this.offlineConfig.cacheChunksForOffline)
                    this.initialLoad();
                this._notifyStatus();
            });

        this.storage = new TupleOfflineStorageService(
            storageFactory,
            new TupleOfflineStorageNameService(locationIndexCacheStorageName)
        );
    }

    isReady(): boolean {
        return this._hasLoaded;
    }

    isReadyObservable(): Observable<void> {
        return this._hasLoadedSubject;
    }

    statusObservable(): Observable<PrivateDiagramLocationLoaderStatusTuple> {
        return this._statusSubject;
    }

    status(): PrivateDiagramLocationLoaderStatusTuple {
        return this._status;
    }

    private _notifyStatus(): void {
        this._status.cacheForOfflineEnabled = this.offlineConfig.cacheChunksForOffline;
        this._status.initialLoadComplete = this.index.initialLoadComplete;
        this._status.loadProgress = Object.keys(this.index.updateDateByChunkKey).length;
        // this._status.loadTotal = BUCKET_COUNT;
        this._statusSubject.next(this._status);
    }

    /** Initial load
     *
     * Load the dates of the index buckets and ask the server if it has any updates.
     */
    private initialLoad(): void {

        this.storage.loadTuples(new UpdateDateTupleSelector())
            .then((tuples: LocationIndexUpdateDateTuple[]) => {
                if (tuples.length != 0) {
                    this.index = tuples[0];

                    if (this.index.initialLoadComplete) {
                        this._hasLoaded = true;
                        this._hasLoadedSubject.next();
                    }

                }

                this._notifyStatus();

                this.setupVortexSubscriptions();
                this.askServerForUpdates();

            });

        this._notifyStatus();

    }

    private setupVortexSubscriptions(): void {

        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(this.lifecycleEmitter,
            clientLocationIndexWatchUpdateFromDeviceFilt)
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe((payloadEnvelope: PayloadEnvelope) => {
                this.processLocationIndexesFromServer(payloadEnvelope);
            });

        // If the vortex service comes back online, update the watch grids.
        this.vortexStatusService.isOnline
            .filter(isOnline => isOnline == true)
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe(() => this.askServerForUpdates());

    }


    //
    private askServerForUpdates() {
        // There is no point talking to the server if it's offline
        if (!this.vortexStatusService.snapshot.isOnline)
            return;

        let tuple = new LocationIndexUpdateDateTuple();
        tuple.updateDateByChunkKey = this.index.updateDateByChunkKey;
        this._status.loadTotal = Object.keys(this.index.updateDateByChunkKey).length;

        let payload = new Payload(clientLocationIndexWatchUpdateFromDeviceFilt, [tuple]);
        this.vortexService.sendPayload(payload);
    }


    /** Process LocationIndexes From Server
     *
     * Process the grids the server has sent us.
     */
    private processLocationIndexesFromServer(payloadEnvelope: PayloadEnvelope) {

        this._status.lastCheck = new Date();

        if (payloadEnvelope.result != null && payloadEnvelope.result != true) {
            console.log(`ERROR: ${payloadEnvelope.result}`);
            return;
        }

        if (payloadEnvelope.filt["finished"] == true) {
            this.index.initialLoadComplete = true;

            this.storage.saveTuples(new UpdateDateTupleSelector(), [this.index])
                .then(() => {
                    this._hasLoaded = true;
                    this._hasLoadedSubject.next();
                    this._notifyStatus();
                })
                .catch(err => console.log(`ERROR : ${err}`));

            return;
        }

        payloadEnvelope
            .decodePayload()
            .then((payload: Payload) => this.storeLocationIndexPayload(payload))
            .catch(e =>
                `LocationIndexCache.processLocationIndexesFromServer failed: ${e}`
            );

    }

    private storeLocationIndexPayload(payload: Payload) {

        let encodedLocationIndexTuples: EncodedLocationIndexTuple[] = <EncodedLocationIndexTuple[]>payload.tuples;

        let tuplesToSave = [];

        for (let item of encodedLocationIndexTuples) {
            tuplesToSave.push(item);
        }


        // 2) Store the index
        this.storeLocationIndexTuples(tuplesToSave)
            .then(() => {
                // 3) Store the update date

                for (let locationIndex of tuplesToSave) {
                    this.index.updateDateByChunkKey[locationIndex.indexBucket] = locationIndex.lastUpdate;
                }

                return this.storage.saveTuples(
                    new UpdateDateTupleSelector(), [this.index]
                );

            })
            .catch(e => console.log(
                `LocationIndexCache.storeLocationIndexPayload: ${e}`));

    }

    /** Store Index Bucket
     * Stores the index bucket in the local db.
     */
    private storeLocationIndexTuples(encodedLocationIndexTuples: EncodedLocationIndexTuple[]): Promise<void> {
        let retPromise: any;
        retPromise = this.storage.transaction(true)
            .then((tx) => {

                let promises = [];

                for (let encodedLocationIndexTuple of encodedLocationIndexTuples) {
                    promises.push(
                        tx.saveTuplesEncoded(
                            new LocationIndexTupleSelector(encodedLocationIndexTuple.indexBucket),
                            encodedLocationIndexTuple.encodedLocationIndexTuple
                        )
                    );
                }

                return Promise.all(promises)
                    .then(() => tx.close());
            });
        return retPromise;
    }

    /** Get Locations
     *
     * Get the location of a Disp.key from the index..
     *
     */
    getLocations(modelSetKey: string, dispKey: string): Promise<DispKeyLocationTuple[]> {
        if (dispKey == null || dispKey.length == 0
            || modelSetKey == null || modelSetKey.length == 0) {
            let val: DispKeyLocationTuple[] = [];
            return Promise.resolve(val);
        }

        if (!this.offlineConfig.cacheChunksForOffline) {
            let ts = new TupleSelector(DispKeyLocationTuple.tupleName, {
                "modelSetKey": modelSetKey,
                "keys": [dispKey]
            });

            let isOnlinePromise: any = this.vortexStatusService.snapshot.isOnline ?
                Promise.resolve() :
                this.vortexStatusService.isOnline
                    .filter(online => online)
                    .first()
                    .toPromise();

            return isOnlinePromise
                .then(() => this.tupleService.offlineObserver.pollForTuples(ts, false));
        }

        if (this.isReady())
            return this.getLocationsFromLocal(modelSetKey, dispKey);

        return this.isReadyObservable()
            .first()
            .toPromise()
            .then(() => this.getLocationsFromLocal(modelSetKey, dispKey));


    }

    /** Get Locations
     *
     * Get the location of a Disp.key from the index..
     *
     */
    private getLocationsFromLocal(modelSetKey: string, dispKey: string): Promise<DispKeyLocationTuple[]> {

        let indexBucket = dispKeyHashBucket(modelSetKey, dispKey);

        if (!this.index.updateDateByChunkKey.hasOwnProperty(indexBucket)) {
            console.log(`DispKey ${dispKey} doesn't appear in the index`);
            return Promise.resolve([]);
        }

        let retPromise: any;
        retPromise = this.storage.loadTuples(new LocationIndexTupleSelector(indexBucket))
            .then((tuples: LocationIndexTuple[]) => {
                if (tuples.length == 0)
                    return [];

                if (tuples.length != 1)
                    throw new Error("We received more tuples then expected");

                let dispIndexArray = JSON.parse(tuples[0].jsonStr);

                let dispLocationIndexRawData: any[] | null = null;

                // TODO These keys are sorted, so we can do a binary search.
                for (let i = 0; i < dispIndexArray.length; i++) {
                    if (dispIndexArray[i][0] == dispKey) {
                        dispLocationIndexRawData = dispIndexArray[i].slice(1);
                        break;
                    }
                }

                // If we didn't find the key, return no indexes
                if (dispLocationIndexRawData == null)
                    return [];

                let dispIndexes: DispKeyLocationTuple[] = [];
                for (let rawData of dispLocationIndexRawData) {
                    let dispLocation = DispKeyLocationTuple.fromLocationJson(rawData);

                    let coordSet = this.coordSetService
                        .coordSetForId(dispLocation.coordSetId);

                    if (coordSet == null)
                        continue;

                    dispLocation.coordSetKey = coordSet.key;

                    dispIndexes.push(dispLocation);
                }

                return dispIndexes;
            });
        return retPromise;

    }

}