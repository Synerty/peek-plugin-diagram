import {Injectable} from "@angular/core";
import {GridTuple} from "../tuples/GridTuple";
import {Observable, Subject} from "rxjs";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageFactoryService,
    TupleStorageServiceABC,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {diagramFilt, gridCacheStorageName} from "@peek/peek_plugin_diagram/_private";


let pako = require("pako");


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

export abstract class GridLoaderA {
    constructor() {

    }

    abstract isReady(): boolean ;

    abstract isReadyObservable(): Observable<boolean> ;

    abstract observable: Observable<GridTuple[]>;

    abstract watchGrids(gridKeys: string[]): void ;

    abstract loadGrids(currentGridUpdateTimes:{ [gridKey: string]: string },
              gridKeys: string[]): void ;

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

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService) {
        super();

        this.storage = storageFactory.create(
            new TupleOfflineStorageNameService(gridCacheStorageName)
        );
        this.storage.open()
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
    loadGrids(currentGridUpdateTimes:{ [gridKey: string]: string },
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
        let gridTuples: GridTuple[] = <GridTuple[]>payload.tuples;

        let tupleCopyObj = new Payload({}, gridTuples).toJsonDict();
        let dictCopy: any = new Payload().fromJsonDict(tupleCopyObj).tuples;

        this.updatesObservable.next(dictCopy);

        this.storeGridTuples(gridTuples);
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
    private storeGridTuples(gridTuples: GridTuple[]): Promise<void> {
        let retPromise: any = this.storage.transaction(true)
            .then((tx) => {

                let promises = [];

                for (let gridTuple of gridTuples) {
                    promises.push(
                        tx.saveTuples(new GridKeyTupleSelector(gridTuple.gridKey), [gridTuple])
                    );
                }

                return Promise.all(promises)
                    .then(() => tx.close())
                    .catch(e => console.log(`GridCache.storeGridTuples: ${e}`));
            });
        return retPromise;
    }

}