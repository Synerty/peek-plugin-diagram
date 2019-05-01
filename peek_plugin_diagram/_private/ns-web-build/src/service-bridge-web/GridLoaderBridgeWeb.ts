import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {
    GridTuple,
    PrivateDiagramGridLoaderServiceA,
    PrivateDiagramGridLoaderStatusTuple
} from "../@peek/peek_plugin_diagram/_private/grid-loader";
import {ServiceBridgeHandlerObserverSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerObservable";
import {ServiceBridgeHandlerCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerCall";


@Injectable({
    providedIn: 'root'
})
export class GridLoaderBridgeWeb extends PrivateDiagramGridLoaderServiceA {

    private iface: window["nsWebViewInterface"];

    private handlers = [];
    private readonly gridObservableHandler: ServiceBridgeHandlerObserverSide;
    private readonly isReadyObservableHandler: ServiceBridgeHandlerObserverSide;
    private readonly statusObservableHandler: ServiceBridgeHandlerObserverSide;

    private readonly startHandler: ServiceBridgeHandlerCallerSide;
    private readonly loadGridsHandler: ServiceBridgeHandlerCallerSide;
    private readonly watchGridsHandler: ServiceBridgeHandlerCallerSide;

    constructor() {
        super();


        // observable
        this.gridObservableHandler = new ServiceBridgeHandlerObserverSide(
            'GridLoaderBridge_observable'
        );
        this.handlers.push(this.gridObservableHandler);


        // isReadyObservable
        this.isReadyObservableHandler = new ServiceBridgeHandlerObserverSide(
            'GridLoaderBridge_isReadyObservable',
            false,
            true,
            false
        );
        this.handlers.push(this.isReadyObservableHandler);


        // statusObservable
        this.statusObservableHandler = new ServiceBridgeHandlerObserverSide(
            'GridLoaderBridge_statusObservable',
            true,
            true,
            new PrivateDiagramGridLoaderStatusTuple()
        );
        this.handlers.push(this.statusObservableHandler);

        // start
        this.startHandler = new ServiceBridgeHandlerCallerSide(
            'GridLoaderBridge_start', false
        );
        this.handlers.push(this.startHandler);

        // loadGrids
        this.loadGridsHandler = new ServiceBridgeHandlerCallerSide(
            'GridLoaderBridge_loadGrids'
        );
        this.handlers.push(this.loadGridsHandler);

        // watchGrids
        this.watchGridsHandler = new ServiceBridgeHandlerCallerSide(
            'GridLoaderBridge_watchGrids'
        );
        this.handlers.push(this.watchGridsHandler);

    }

    private initHandler(): void {
        for (let handler of this.handlers) {
            handler.start(this.iface);
        }

        this.startHandler.call("nothing");
    }

    get observable(): Observable<GridTuple[]> {
        return this.gridObservableHandler.observable;
    }

    isReady(): boolean {
        this.initHandler();
        return this.isReadyObservableHandler.lastData;
    }


    isReadyObservable(): Observable<boolean> {
        return this.isReadyObservableHandler.observable;
    }

    status(): PrivateDiagramGridLoaderStatusTuple {
        return this.statusObservableHandler.lastData;
    }

    statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> {
        return this.statusObservableHandler.observable;
    }


    loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
              gridKeys: string[]): void {
        this.loadGridsHandler.call(currentGridUpdateTimes, gridKeys);
    }

    watchGrids(gridKeys: string[]): void {
        this.watchGridsHandler.call(gridKeys);
    }


}
