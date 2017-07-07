import {Injectable} from "@angular/core";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {VortexService, extend} from "@synerty/vortexjs";
import {GridUpdateEventI, PeekModelGridDataStore} from "./PeekModelGridDataStore";
import {PeekModelGridLookupStore} from "./PeekModelGridLookupStore";
import Subject from "rxjs";
import {dictKeysFromObject, dictSetFromArray, dictValuesFromObject} from "../DiagramUtil";


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
export class PeekModelGridDataManager {
    _gridLookupStore:PeekModelGridLookupStore;
    _gridDataStore:PeekModelGridDataStore;

        // Variables required to determine when we need to inform the
        // server of view changes.
        _viewingGridKeysByCanvasId = {};


    gridUpdatesNotify : Subject<GridUpdateEventI>;

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private vortexService:VortexService) {

        // Create/store references to the data stores
        this._gridLookupStore = new PeekModelGridLookupStore(
            balloonMsg, vortexService
        );
        this._gridDataStore = new PeekModelGridDataStore(
            balloonMsg, vortexService, this._gridLookupStore,
        );


        // Observable for the canvas to receive updates from the server
        this.gridUpdatesNotify = this._gridDataStore._gridUpdatesNofity;

        // Initialise this class
        this._init();
    }

// ============================================================================
// Init

    isReady() {
        return (this._gridLookupStore.isReady()
        && this._gridDataStore.isReady());
    };

// ============================================================================
// Accessors for common lookup data

    _init() {

    };


// ============================================================================
// Pass through some methods
loadGridKeys(requestedGridKeys:string[]) {
    this._gridDataStore.loadGridKeys(requestedGridKeys);
}


// ============================================================================
// Pass through some accessors
levelsOrderedByOrder() {
    this._gridLookupStore.layersOrderedByOrder();
}

// ============================================================================
// Canvas viewing area changed

    canvasViewChanged(canvasId, gridKeys) {
        this._viewingGridKeysByCanvasId[canvasId] = gridKeys;

        let setOfGridKeys = {};
        let listOfGridKeys = dictValuesFromObject(this._viewingGridKeysByCanvasId);
        for (let i = 0; i < listOfGridKeys.length; i++) {
            extend(setOfGridKeys, dictSetFromArray(listOfGridKeys[i]));
        }

        let filt = {
            gridKeys: dictKeysFromObject(setOfGridKeys),
            'key': "repo.client.grid.observe"
        };
        this.vortexService.sendFilt(filt);
    };


// ============================================================================
// Create manage model single instance

}

