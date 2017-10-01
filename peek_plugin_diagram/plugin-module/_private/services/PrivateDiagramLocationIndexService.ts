import {Injectable} from "@angular/core";
import {LocationIndexTuple} from "../tuples/LocationIndexTuple";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
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

import * as moment from "moment";
import {LocationIndexUpdateDateTuple} from "../tuples/LocationIndexUpdateDateTuple";
import {DispKeyLocationTuple} from "../tuples/DispLocationTuple";
import {PrivateDiagramCoordSetService} from "./PrivateDiagramCoordSetService";

import {Subject, Observable} from "rxjs";

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
    constructor(modelSetKey: string) {
        super(LocationIndexUpdateDateTuple.tupleName, {
            modelSetKey: modelSetKey
        });
    }
}


// ----------------------------------------------------------------------------
/** hash method
 */
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

    hash = hash & 1023; // 1024 buckets

    return `${modelSetKey}:${hash}`;
}


// ----------------------------------------------------------------------------
/** LocationIndex Cache
 *
 * This class has the following responsibilities:
 *
 * 1) Maintain a local storage of the index
 *
 * 2) Return DispKey locations based on the index.
 *
 */
@Injectable()
export class PrivateDiagramLocationIndexService {

    private indexByModelSet = {};
    private storage: TupleOfflineStorageService;

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService,
                private coordSetService:PrivateDiagramCoordSetService) {

        this.storage = new TupleOfflineStorageService(
            storageFactory,
            new TupleOfflineStorageNameService(locationIndexCacheStorageName)
        );

    }

    indexForModelSetKey(modelSetKey:string) : Promise<LocationIndex> {
        if (this.indexByModelSet.hasOwnProperty(modelSetKey)) {
            return Promise.resolve(this.indexByModelSet[modelSetKey]);
        }

        let newIndex = new LocationIndex(
            this.vortexService,
            this.vortexStatusService,
            this.storage,
            modelSetKey,
            this.coordSetService
        );
        this.indexByModelSet[modelSetKey] = newIndex;
        return new Promise<LocationIndex>((resolve, reject) => {
            newIndex.isReady()
                .first()
                .subscribe(() =>{
                    resolve(newIndex);
                });
        });
    }


}

export class LocationIndex {

    private indexBucketUpdateDates = {};

    // TODO, There appears to be no way to tear down a service
    private lifecycleEmitter = new ComponentLifecycleEventEmitter();

    private _hasLoaded = new Subject<void>();

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                private storage: TupleOfflineStorageService,
                private modelSetKey:string,
                private coordSetService:PrivateDiagramCoordSetService) {

        this.initialLoad();

        this.vortexStatusService
            .isOnline
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .filter((val) => val)
            .subscribe(() => this.askServerForUpdates());
    }

    isReady(): Observable<void> {
        return this._hasLoaded;
    }

    /** Initial load
     *
     * Load the dates of the index buckets and ask the server if it has any updates.
     */
    private initialLoad(): void {

        this.storage.loadTuples(new UpdateDateTupleSelector(this.modelSetKey))
            .then((tuples: LocationIndexUpdateDateTuple[]) => {
                if (tuples.length != 0) {
                    this.indexBucketUpdateDates = tuples[0].indexBucketUpdateDates;
                    if (this.vortexStatusService.snapshot.isOnline)
                        this._hasLoaded.next();
                }

                this.setupVortexSubscriptions();
                this.askServerForUpdates();

            });

    }

    private setupVortexSubscriptions(): void {

        let filt = extend({modelSetKey:this.modelSetKey},
            clientLocationIndexWatchUpdateFromDeviceFilt);

        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(this.lifecycleEmitter, filt)
            .takeUntil(this.lifecycleEmitter.onDestroyEvent)
            .subscribe((payload: Payload) => this.processLocationIndexesFromServer(payload));

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
        tuple.indexBucketUpdateDates = this.indexBucketUpdateDates;

        let filt = extend({modelSetKey:this.modelSetKey},
            clientLocationIndexWatchUpdateFromDeviceFilt);

        let payload = new Payload(filt, [tuple]);
        this.vortexService.sendPayload(payload);
    }


    /** Process LocationIndexes From Server
     *
     * Process the grids the server has sent us.
     */
    private processLocationIndexesFromServer(payload: Payload) {
        if (payload.result != null && payload.result != true) {
            console.log(payload.result);
            return;
        }

        if (payload.filt["finished"] == true) {
            this._hasLoaded.next();
            return;
        }

        let locationIndexTuples: LocationIndexTuple[] = <LocationIndexTuple[]>payload.tuples;

        let tuplesToSave = [];

        for (let locationIndex of locationIndexTuples) {
            let updateDate = this.indexBucketUpdateDates[locationIndex.indexBucket];

            // If the cache is newer, ignore the update
            // This really shouldn't happen.
            if (updateDate != null) {
                let cacheLocationIndexDate = moment(updateDate);
                let newLocationIndexDate = moment(locationIndex.lastUpdate);
                if (newLocationIndexDate.isBefore(cacheLocationIndexDate)) {
                    continue
                }
            }

            tuplesToSave.push(locationIndex);
        }


        // 2) Store the index
        this.storeLocationIndexTuples(tuplesToSave)
            .then(() => {
                // 3) Store the update date

                for (let locationIndex of tuplesToSave) {
                    this.indexBucketUpdateDates[locationIndex.indexBucket] = locationIndex.lastUpdate;
                }

                let updateDateTuple = new LocationIndexUpdateDateTuple();
                updateDateTuple.modelSetKey = this.modelSetKey;
                updateDateTuple.indexBucketUpdateDates = this.indexBucketUpdateDates;

                return this.storage.saveTuples(
                    new UpdateDateTupleSelector(this.modelSetKey), [updateDateTuple]
                );
            })
            .catch(e => console.log(
                `LocationIndexCache.storeLocationIndexTuples: ${e}`));

    }

    /** Store Index Bucket
     * Stores the index bucket in the local db.
     */
    private storeLocationIndexTuples(locationIndexTuples: LocationIndexTuple[]): Promise<void> {
        let retPromise: any;
        retPromise = this.storage.transaction(true)
            .then((tx) => {

                let promises = [];

                for (let locationIndexTuple of locationIndexTuples) {
                    promises.push(
                        tx.saveTuples(
                            new LocationIndexTupleSelector(locationIndexTuple.indexBucket),
                            [locationIndexTuple]
                        )
                    );
                }

                return Promise.all(promises)
                    .then(() => tx.close())
                    .catch(e => console.log(
                        `LocationIndexCache.storeLocationIndexTuples: ${e}`));
            });
        return retPromise;
    }

    /** Get Locations
     *
     * Get the location of a Disp.key from the index..
     *
     */
    getLocations(dispKey: string): Promise<DispKeyLocationTuple[]> {
        let indexBucket = dispKeyHashBucket(this.modelSetKey, dispKey);

        if (!this.indexBucketUpdateDates.hasOwnProperty(indexBucket)) {
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

                let jsonStr = pako.inflate(tuples[0].blobData, {to: "string"});
                let dispIndexArray = JSON.parse(jsonStr);

                let dispLocationIndexRawData :any[] | null = null;

                // TODO These keys are sorted, so we can do a binary search.
                for (let i = 0; i  < dispIndexArray.length; i++) {
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

                    dispLocation.coordSetKey = this.coordSetService
                        .coordSetForId(dispLocation.coordSetId)
                        .key;

                    dispIndexes.push(dispLocation);
                }

                return dispIndexes;
            });
        return retPromise;

    }

}