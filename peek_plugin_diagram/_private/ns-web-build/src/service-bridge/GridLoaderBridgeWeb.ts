import {Injectable} from "@angular/core";
import {Payload} from "@synerty/vortexjs";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {
    GridTuple,
    PrivateDiagramGridLoaderStatusTuple,
    PrivateDiagramGridLoaderServiceA
} from "../@peek/peek_plugin_diagram/_private/grid-loader";


@Injectable()
export class GridLoaderBridgeWeb extends PrivateDiagramGridLoaderServiceA {

    private static updateSubject = new Subject<GridTuple[]>();
    private static readySubject = new Subject<boolean>();
    private static isReadyVal = false;

    private static _statusSubject = new Subject<PrivateDiagramGridLoaderStatusTuple>();
    private static _status = new PrivateDiagramGridLoaderStatusTuple();

    private static iface: any;

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

        GridLoaderBridgeWeb.iface.on(
            'GridLoaderBridge_statusObservable',
            (argObj: any) => {
                let status: any = new Payload().fromJsonDict(argObj).tuples[0];
                console.log("WEB: Received GridLoaderBridge_statusObservable event");
                GridLoaderBridgeWeb._status = status;
                GridLoaderBridgeWeb._statusSubject.next(status);
            }
        );


        GridLoaderBridgeWeb.iface.emit("GridLoaderBridge_start", "nothing");
    }

    get observable(): Observable<GridTuple[]> {
        return GridLoaderBridgeWeb.updateSubject;

    }

    isReady(): boolean {
        GridLoaderBridgeWeb.initHandler();
        return GridLoaderBridgeWeb.isReadyVal;
    }


    isReadyObservable(): Observable<boolean> {
        return GridLoaderBridgeWeb.readySubject;
    }

    statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> {
        return GridLoaderBridgeWeb._statusSubject;
    }

    status(): PrivateDiagramGridLoaderStatusTuple {
        return GridLoaderBridgeWeb._status;
    }


    loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
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
