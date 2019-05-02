import {
    Payload,
    Tuple,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageServiceABC
} from "@synerty/vortexjs";

import {TupleStorageTransaction} from "@synerty/vortexjs/src/vortex/storage/TupleStorageServiceABC";
import {ServiceBridgeHandlerPromiseCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerPromise";


export class TupleStorageBridgeWeb extends TupleStorageServiceABC {

    private handlers = [];

    private readonly loadTuplesEncodedHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly saveTuplesEncodedHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly deleteTuplesHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly deleteOldTuplesHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly truncateStorageHandler: ServiceBridgeHandlerPromiseCallerSide;

    constructor(name: TupleOfflineStorageNameService) {
        super(name);
        let iface: any = window["nsWebViewInterface"];

        // loadTuplesEncoded
        this.loadTuplesEncodedHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleStorageBridge_loadTuplesEncoded'
        );
        this.handlers.push(this.loadTuplesEncodedHandler);

        // saveTuplesEncoded
        this.saveTuplesEncodedHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleStorageBridge_saveTuplesEncoded'
        );
        this.handlers.push(this.saveTuplesEncodedHandler);

        // deleteTuples
        this.deleteTuplesHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleStorageBridge_deleteTuples'
        );
        this.handlers.push(this.deleteTuplesHandler);

        // deleteOldTuples
        this.deleteOldTuplesHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleStorageBridge_deleteOldTuples',
            false
        );
        this.handlers.push(this.deleteOldTuplesHandler);

        // truncateStorage
        this.truncateStorageHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleStorageBridge_truncateStorage',
            false
        );
        this.handlers.push(this.truncateStorageHandler);

        for (let handler of this.handlers) {
            handler.start(iface);
        }
    }


    open(): Promise<void> {
        return Promise.resolve();
    }

    isOpen(): boolean {
        return true;
    }

    close(): void {
    }

    truncateStorage(): Promise<void> {
        return this.truncateStorageHandler.call();
    }


    transaction(forWrite: boolean): Promise<TupleStorageTransaction> {
        return Promise.resolve(new Transaction(forWrite,
            this.loadTuplesEncodedHandler,
            this.saveTuplesEncodedHandler,
            this.deleteTuplesHandler,
            this.deleteOldTuplesHandler
        ));
    }

}

class Transaction implements TupleStorageTransaction {

    constructor(private forWrite: boolean,
                private loadTuplesEncodedHandler: ServiceBridgeHandlerPromiseCallerSide,
                private saveTuplesEncodedHandler: ServiceBridgeHandlerPromiseCallerSide,
                private deleteTuplesHandler: ServiceBridgeHandlerPromiseCallerSide,
                private deleteOldTuplesHandler: ServiceBridgeHandlerPromiseCallerSide) {

    }

    loadTuples(tupleSelector: TupleSelector): Promise<Tuple[]> {
        return this.loadTuplesEncoded(tupleSelector)
            .then((encodedPayload: string) => {
                if (encodedPayload == null) {
                    return [];
                }

                return Payload.fromEncodedPayload(encodedPayload)
                    .then((payload: Payload) => payload.tuples);
            });
    }

    loadTuplesEncoded(tupleSelector: TupleSelector): Promise<string | null> {
        return this.loadTuplesEncodedHandler.call(tupleSelector);
    }

    saveTuples(tupleSelector: TupleSelector, tuples: Tuple[]): Promise<void> {
        // The payload is a convenient way to serialise and compress the data
        return new Payload({}, tuples).toEncodedPayload()
            .then((encodedPayload: string) => {
                return this.saveTuplesEncoded(tupleSelector, encodedPayload);
            });
    }

    saveTuplesEncoded(tupleSelector: TupleSelector, encodedPayload: string): Promise<void> {
        return this.saveTuplesEncodedHandler.call(tupleSelector, encodedPayload);
    }

    deleteTuples(tupleSelector: TupleSelector): Promise<void> {
        return this.deleteTuplesHandler.call(tupleSelector);
    }

    deleteOldTuples(deleteDataBeforeDate: Date): Promise<void> {
        return this.deleteOldTuplesHandler.call(deleteDataBeforeDate);
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

}
