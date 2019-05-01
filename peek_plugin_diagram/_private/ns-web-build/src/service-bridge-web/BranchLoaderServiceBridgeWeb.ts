import {Injectable} from "@angular/core";
import {Payload} from "@synerty/vortexjs";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {
    GridTuple,
    PrivateDiagramGridLoaderServiceA,
    PrivateDiagramGridLoaderStatusTuple
} from "../@peek/peek_plugin_diagram/_private/grid-loader";


@Injectable({
    providedIn: 'root'
})
export class BranchLoaderServiceBridgeWeb extends PrivateDiagramBranchLoaderServiceA {

    private updateSubject = new Subject<GridTuple[]>();
    private readySubject = new Subject<boolean>();
    private isReadyVal = false;

    private _statusSubject = new Subject<PrivateDiagramGridLoaderStatusTuple>();
    private _status = new PrivateDiagramGridLoaderStatusTuple();

    private iface: any;

    private isInitialised = false;

    constructor() {
        super();
    }

    private initHandler(): void {
        this.iface = window["nsWebViewInterface"];

        this.iface.on(
            'DiagramLoadBridge_observable',
            (argObj: any) => {
                let grids: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("WEB: Received DiagramLoadBridge_observable event");
                this.updateSubject.next(grids);
            }
        );

        this.iface.on(
            'DiagramLoadBridge_isReadyObservable',
            (val: boolean) => {
                console.log("WEB: Received DiagramLoadBridge_isReadyObservable event");
                this.isReadyVal = val;
                this.readySubject.next(val);
            }
        );

        this.iface.on(
            'DiagramLoadBridge_statusObservable',
            (argObj: any) => {
                let status: any = new Payload().fromJsonDict(argObj).tuples[0];
                console.log("WEB: Received DiagramLoadBridge_statusObservable event");
                this._status = status;
                this._statusSubject.next(status);
            }
        );


        this.iface.emit("DiagramLoadBridge_start", "nothing");
    }

    get observable(): Observable<GridTuple[]> {
        return this.updateSubject;

    }

    isReady(): boolean {
        this.initHandler();
        return this.isReadyVal;
    }


    isReadyObservable(): Observable<boolean> {
        return this.readySubject;
    }

    statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> {
        return this._statusSubject;
    }

    status(): PrivateDiagramGridLoaderStatusTuple {
        return this._status;
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
        this.iface.emit("DiagramLoadBridge_loadGrids", argObj);
    }

    watchGrids(gridKeys: string[]): void {
        let argObj = new Payload({}, gridKeys).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("WEB: Sending DiagramLoadBridge_watchGrids event");
        this.iface.emit("DiagramLoadBridge_watchGrids", argObj);
    }


}
