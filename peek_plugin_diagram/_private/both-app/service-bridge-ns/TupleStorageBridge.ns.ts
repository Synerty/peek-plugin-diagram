import {WebViewInterface} from 'nativescript-webview-interface';
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";
import {ServiceBridgeHandlerPromiseCalleeSide} from "../service-bridge-util/ServiceBridgeHandlerPromise";

export class TupleStorageBridgeNs {

    private handlers = [];

    constructor(private tupleService: PrivateDiagramTupleService,
                private iface: WebViewInterface) {

        // loadTuplesEncoded
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleStorageBridge_loadTuplesEncoded',
            true,
            this.tupleService.offlineStorage.loadTuplesEncoded
        ));

        // saveTuplesEncoded
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleStorageBridge_saveTuplesEncoded',
            true,
            this.tupleService.offlineStorage.saveTuplesEncoded
        ));

        // deleteTuples
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleStorageBridge_deleteTuples',
            true,
            this.tupleService.offlineStorage.deleteTuples
        ));

        // deleteOldTuples
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleStorageBridge_deleteOldTuples',
            false,
            this.tupleService.offlineStorage.deleteOldTuples
        ));

        // truncateStorage
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'TupleStorageBridge_truncateStorage',
            false,
            this.tupleService.offlineStorage.truncateStorage
        ));

        for (let handler of this.handlers) {
            handler.start(iface);
        }
    }


}