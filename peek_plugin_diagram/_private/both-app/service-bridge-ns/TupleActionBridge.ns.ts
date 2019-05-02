import {WebViewInterface} from 'nativescript-webview-interface';
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";
import {ServiceBridgeHandlerPromiseCalleeSide} from "../service-bridge-util/ServiceBridgeHandlerPromise";

export class TupleActionBridgeNs {

    private handlers = [];

    constructor(private actionService: PrivateDiagramTupleService,
                private iface: WebViewInterface) {

        // countActions
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleActionBridge_countActions',
            true,
            this.actionService.offlineAction.countActions
        ));

        // deleteActions
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleActionBridge_deleteActions',
            true,
            this.actionService.offlineAction.deleteActions
        ));

        // storeAction
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleActionBridge_storeAction',
            true,
            this.actionService.offlineAction.storeAction
        ));

        for (let handler of this.handlers) {
            handler.start(iface);
        }
    }


}