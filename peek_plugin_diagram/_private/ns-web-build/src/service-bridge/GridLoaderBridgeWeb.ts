import {Injectable, OnDestroy} from "@angular/core";
import {
    Payload,
    Tuple,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageServiceABC
} from "@synerty/vortexjs";
import {GridLoaderA} from "../peek_plugin_diagram/cache/GridLoader";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import {GridTuple} from "../peek_plugin_diagram/tuples/GridTuple";


@Injectable()
export class GridLoaderBridgeWeb extends GridLoaderA {

    private static updateSubject = new Subject<GridTuple[]>();
    private static readySubject = new Subject<boolean>();
    private static isReadyVal = false;

    private static iface:any;

    private static isInitialised = false;

    constructor() {
        super();
    }

    private static initHandler(): void {
        if (GridLoaderBridgeWeb.isInitialised)
            return;

        GridLoaderBridgeWeb.isInitialised = true;

        GridLoaderBridgeWeb.iface = window["nsWebViewInterface"];

        GridLoaderBridgeWeb.iface.on(
            'GridLoaderBridge_observable',
            (argObj: any) => {
                let grids: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("WEB: Received GridLoaderBridge_observable event");
                GridLoaderBridgeWeb.updateSubject.next(grids);
            }
        );

        GridLoaderBridgeWeb.iface.on(
            'GridLoaderBridge_isReadyObservable',
            (val: boolean) => {
                console.log("WEB: Received GridLoaderBridge_isReadyObservable event");
                GridLoaderBridgeWeb.isReadyVal = val;
                GridLoaderBridgeWeb.readySubject.next(val);
            }
        );


        GridLoaderBridgeWeb.iface.emit("GridLoaderBridge_start", "nothing");
    }

    get observable(): Observable<GridTuple[]>{
        return GridLoaderBridgeWeb.updateSubject;

    }

    isReady(): boolean {
        GridLoaderBridgeWeb.initHandler();
        return GridLoaderBridgeWeb.isReadyVal;
    }


     isReadyObservable(): Observable<boolean>  {
        return GridLoaderBridgeWeb.readySubject;
     }

    cacheAll(): void {
      throw new Error("Not Implemented");
    }


    loadGrids(currentGridUpdateTimes:{ [gridKey: string]: string },
              gridKeys: string[]): void {

        let args: any = {
            currentGridUpdateTimes: currentGridUpdateTimes,
            gridKeys: gridKeys
        };

        let argObj = new Payload({}, args).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("WEB: Sending GridLoaderBridge_loadGrids event");
        GridLoaderBridgeWeb.iface.emit("GridLoaderBridge_loadGrids", argObj);
    }

    watchGrids(gridKeys: string[]): void {
        let argObj = new Payload({}, gridKeys).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("WEB: Sending GridLoaderBridge_watchGrids event");
        GridLoaderBridgeWeb.iface.emit("GridLoaderBridge_watchGrids", argObj);
    }


}
