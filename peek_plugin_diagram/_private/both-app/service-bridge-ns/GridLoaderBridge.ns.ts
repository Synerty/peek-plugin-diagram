import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {PrivateDiagramGridLoaderServiceA} from "@peek/peek_plugin_diagram/_private/grid-loader";
import {ServiceBridgeHandlerObservableSide} from "../service-bridge-util/ServiceBridgeHandlerObservable";
import {ServiceBridgeHandlerCalleeSide} from "../service-bridge-util/ServiceBridgeHandlerCall";

export class GridLoaderBridgeNs {

    private handlers = [];
    private readonly isReadyHandler: ServiceBridgeHandlerObservableSide;

    constructor(lifeCycleEvents: ComponentLifecycleEventEmitter,
                private gridLoader: PrivateDiagramGridLoaderServiceA,
                private iface: WebViewInterface) {

        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'GridLoaderBridge_observable',
            true,
            this.gridLoader.observable,
            lifeCycleEvents
        ));

        this.isReadyHandler = new ServiceBridgeHandlerObservableSide(
            'GridLoaderBridge_isReadyObservable',
            false,
            this.gridLoader.isReadyObservable,
            lifeCycleEvents
        );
        this.handlers.push(this.isReadyHandler);

        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'GridLoaderBridge_statusObservable',
            false,
            this.gridLoader.statusObservable,
            lifeCycleEvents
        ));

        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'GridLoaderBridge_start', false, this.start
        ));

        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'GridLoaderBridge_loadGrids', true,
            this.gridLoader.loadGrids,
        ));

        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'GridLoaderBridge_watchGrids', true,
            this.gridLoader.watchGrids
        ));

    }

    private start(): void {
        for (let handler of this.handlers) {
            handler.start(this.iface);
        }

        this.isReadyHandler.notify(this.gridLoader.isReady());

    }


}