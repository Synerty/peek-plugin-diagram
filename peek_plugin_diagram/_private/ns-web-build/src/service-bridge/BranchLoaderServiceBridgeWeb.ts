import {Injectable} from "@angular/core";
import {Payload} from "@synerty/vortexjs";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {
    GridTuple,
    PrivateDiagramGridLoaderServiceA,
    PrivateDiagramGridLoaderStatusTuple
} from "../@peek/peek_plugin_diagram/_private/grid-loader";


@Injectable()
export class BranchLoaderServiceBridgeWeb extends PrivateDiagramBranchLoaderServiceA {

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
        if (DiagramLoadBridgeWeb.isInitialised)
            return;

        DiagramLoadBridgeWeb.isInitialised = true;

        DiagramLoadBridgeWeb.iface = window["nsWebViewInterface"];

        DiagramLoadBridgeWeb.iface.on(
            'DiagramLoadBridge_observable',
            (argObj: any) => {
                let grids: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("WEB: Received DiagramLoadBridge_observable event");
                DiagramLoadBridgeWeb.updateSubject.next(grids);
            }
        );

        DiagramLoadBridgeWeb.iface.on(
            'DiagramLoadBridge_isReadyObservable',
            (val: boolean) => {
                console.log("WEB: Received DiagramLoadBridge_isReadyObservable event");
                DiagramLoadBridgeWeb.isReadyVal = val;
                DiagramLoadBridgeWeb.readySubject.next(val);
            }
        );

        DiagramLoadBridgeWeb.iface.on(
            'DiagramLoadBridge_statusObservable',
            (argObj: any) => {
                let status: any = new Payload().fromJsonDict(argObj).tuples[0];
                console.log("WEB: Received DiagramLoadBridge_statusObservable event");
                DiagramLoadBridgeWeb._status = status;
                DiagramLoadBridgeWeb._statusSubject.next(status);
            }
        );


        DiagramLoadBridgeWeb.iface.emit("DiagramLoadBridge_start", "nothing");
    }

    get observable(): Observable<GridTuple[]> {
        return DiagramLoadBridgeWeb.updateSubject;

    }

    isReady(): boolean {
        DiagramLoadBridgeWeb.initHandler();
        return DiagramLoadBridgeWeb.isReadyVal;
    }


    isReadyObservable(): Observable<boolean> {
        return DiagramLoadBridgeWeb.readySubject;
    }

    statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> {
        return DiagramLoadBridgeWeb._statusSubject;
    }

    status(): PrivateDiagramGridLoaderStatusTuple {
        return DiagramLoadBridgeWeb._status;
    }


    loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
              gridKeys: string[]): void {

        let args: any = {
            currentGridUpdateTimes: currentGridUpdateTimes,
            gridKeys: gridKeys
        };

        let argObj = new Payload({}, args).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("WEB: Sending DiagramLoadBridge_loadGrids event");
        DiagramLoadBridgeWeb.iface.emit("DiagramLoadBridge_loadGrids", argObj);
    }

    watchGrids(gridKeys: string[]): void {
        let argObj = new Payload({}, gridKeys).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("WEB: Sending DiagramLoadBridge_watchGrids event");
        DiagramLoadBridgeWeb.iface.emit("DiagramLoadBridge_watchGrids", argObj);
    }


}
