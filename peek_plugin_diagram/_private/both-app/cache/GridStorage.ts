import {Injectable} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    extend,
    IPayloadFilt,
    PayloadEndpoint,
    VortexService
} from "@synerty/vortexjs";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {Subject} from "rxjs";
import {NoopDb} from "./NoopDb";
import {WebSqlDb} from "./WebSqlDb";
import {IndexedDb} from "./IndexedDb";
import {dateStr, dictKeysFromObject, dictSetFromArray, assert, bind} from "../DiagramUtil";
import {LookupCache} from "./LookupCache";
import {GridTuple} from "../tuples/GridTuple";
import {LinkedGrid} from "./PeekCanvasModelGrid";



/** Grid Update Event
 *
 * This is the interface of the data emitted when grid updates are received by the server
 *
 */
export interface GridUpdateEventI {
    modelGrids: LinkedGrid[];
    fromServer: boolean;
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
@Injectable()
export class GridDataStore extends ComponentLifecycleEventEmitter {

    _gridDataStore;

    // Store grids from the server by gridKey.
    _gridBuffer = {};

    _gridUpdatesNofity = new Subject<GridUpdateEventI>();

    _modelServerListenFilt: IPayloadFilt;
    _modelServerEndpoint: PayloadEndpoint;


    constructor(private balloonMsg: Ng2BalloonMsgService,
                private vortexService: VortexService,
                private gridLookupStore: LookupCache) {
        super();

        let providers = [WebSqlDb, IndexedDb];

        for (let i = 0; i < providers.length; i++) {
            let SqlDb = providers[i];
            try {
                this._gridDataStore = new SqlDb(balloonMsg, vortexService);
                break;
            } catch (e) {
                console.log("ERROR LOADING" + SqlDb);
                console.log(e);
            }
        }

        if (this._gridDataStore) {
            this.balloonMsg.showInfo("Using " + this._gridDataStore.name + " Client Caching");
        } else {
            this._gridDataStore = new NoopDb();
            this.balloonMsg.showWarning("Client caching not supported, we'll work with out it.");
        }

        this._modelServerListenFilt = {key: "repo.client.grid.update_check"};
        this._modelServerEndpoint = this.vortexService.createEndpointObservable(
            this, this._modelServerListenFilt
        ).subscribe(p => this._processServerPayload(p));

        this._init();


    }

// ============================================================================
// Init

    isReady() {
        return true;
    };

// ============================================================================
// Init the class

    _init() {


    };


// ============================================================================
// Handlers for display data

    /** Load grid keys
     *
     * @param requestedGridKeys : The new grid keys to load
     */
    loadGridKeys(requestedGridKeys: string[]) {


        // Delay the loading if the cache is not yet initiailised
        if (this._gridDataStore == null || !this._gridDataStore.isReady()) {
            console.log(dateStr() + "Cache: Delaying call loadFromDispCache, things arn't ready yet");
            setTimeout(function () {
                this.loadGridKeys(requestedGridKeys);
            }, 5);
            return;
        }

        // LOAD FROM MEMCACHE FIRST
        let gridKeysNotInMemory = [];
        let modelGrids = [];

        let requestServerUpdatesFilt = extend(
            {
                grids: []
            },
            this._modelServerListenFilt
        );


        // Merge in the buffered responses with the server updates.
        for (let i = 0; i < requestedGridKeys.length; i++) {
            let requestedGridKey = requestedGridKeys[i];

            let modelGridFromMemCache = this._gridBuffer[requestedGridKey];

            if (modelGridFromMemCache) {
                modelGrids.push(modelGridFromMemCache);

                // Add to our list of server update checks
                requestServerUpdatesFilt.grids.push({
                    gridKey: modelGridFromMemCache.gridKey,
                    lastUpdate: modelGridFromMemCache.lastUpdate
                });

            } else {
                gridKeysNotInMemory.push(requestedGridKey);

            }
        }

        // Ask the indexeddb about the remainder
        this._gridDataStore.loadFromDispCache(
            gridKeysNotInMemory, bind(self, this._processCachedLoadedGrids));

        // Give the grid updates from memory to the canvas(es)
        this._gridUpdatesNofity.next({modelGrids: modelGrids, fromServer: false});

        if (requestServerUpdatesFilt.grids.length) {
            // Ask the server for updates for the grids we just got from memory
            console.log(dateStr() + "Cache.loadGridKeys: Requesting grids from" +
                " server : " + requestServerUpdatesFilt.grids);
            this.vortexService.sendFilt(requestServerUpdatesFilt);
        }

    };


    _processServerPayload(payload) {


        if (payload.result) {
            this.balloonMsg.showError(dateStr() + "GridDataStore: Grid update failed : " + payload.result);
            return;
        }

        let compiledGrids = payload.tuples;
        let requestedGridKeysSet = {};

        // Grid updates for observed grids won't have grid keys.
        if (payload.filt.gridKeys != null)
            requestedGridKeysSet = dictSetFromArray(payload.filt.gridKeys);

        // List of modelGrids to sent to canvas
        let modelGrids = [];

        // Overwrite with all the new ones
        for (let i = 0; i < compiledGrids.length; i++) {
            let compiledGrid = compiledGrids[i];

            let modelGrid = new LinkedGrid(compiledGrid, this.gridLookupStore);
            this._gridBuffer[modelGrid.gridKey] = modelGrid;
            modelGrids.push(modelGrid);
            delete requestedGridKeysSet[modelGrid.gridKey]

        }

        // If the keys arn't in the server, then they don't exist
        let requestedGridKeysArray = dictKeysFromObject(requestedGridKeysSet);
        for (let i = 0; i < requestedGridKeysArray.length; i++) {
            let requestedGridKey = requestedGridKeysArray[i];

            // Create the empty model grid.
            let modelGrid = new LinkedGrid(requestedGridKey);
            this._gridBuffer[modelGrid.gridKey] = modelGrid;
            modelGrids.push(modelGrid);
        }

        // Inform the canvas(es) that we have grid updates
        this._gridUpdatesNofity.next({modelGrids: modelGrids, fromServer: true});

        // Update the index db
        this._gridDataStore.updateDispCache(compiledGrids);

        console.log(dateStr() + "Cache: Loaded " + compiledGrids.length
            + " compiled grids from server - " + requestedGridKeysArray);
    };


    _processCachedLoadedGrids(requestedGridKeys: string[],
                              compiledGrids: GridTuple[]) {


        // Filt to ask the server for updates
        let filt = extend({
                grids: []
            },
            this._modelServerListenFilt);

        let gridKeysLoadedFromCache = {};

        // Overwrite with all the new ones
        let modelGrids = [];
        for (let i = 0; i < compiledGrids.length; i++) {
            let compiledGrid = compiledGrids[i];

            // Server update request
            filt.grids.push({
                gridKey: compiledGrid.gridKey,
                lastUpdate: compiledGrid.lastUpdate
            });
            gridKeysLoadedFromCache[compiledGrid.gridKey] = true;

            // Load disps and buffer in memory
            let modelGrid = new LinkedGrid(compiledGrid, this.gridLookupStore);
            this._gridBuffer[modelGrid.gridKey] = modelGrid;
            modelGrids.push(modelGrid);
        }

        // Inform the canvas(es) that we have grid updates
        this._gridUpdatesNofity.next({modelGrids: modelGrids, fromServer: false});


        // The grids not in the cache
        for (let i = 0; i < requestedGridKeys.length; i++) {
            let gridKey = requestedGridKeys[i];
            if (gridKeysLoadedFromCache[gridKey] == true) {
                continue;
            }

            filt.grids.push({
                gridKey: gridKey,
                lastUpdate: ''
            });
        }

        if (filt.grids.length) {
            console.log(dateStr() + "Cache: Requesting grids from server : " + requestedGridKeys);
            this.vortexService.sendFilt(filt);
        }

    };


}

