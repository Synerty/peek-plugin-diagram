import {
    Payload,
    Tuple,
    TupleOfflineStorageNameService,
    TupleSelector,
    TupleStorageServiceABC
} from "@synerty/vortexjs";

import {TupleStorageTransaction} from "@synerty/vortexjs/src/vortex/storage/TupleStorageServiceABC";


export class TupleStorageBridgeWeb extends TupleStorageServiceABC {

    static promsById = {};
    static nextPromiseId = 1;
    
    private static isInitialised = false;

    constructor(name: TupleOfflineStorageNameService) {
        super(name);

        TupleStorageBridgeWeb.initHandler();
    }

    private static initHandler(): void {
        if (TupleStorageBridgeWeb.isInitialised)
            return;
        
        TupleStorageBridgeWeb.isInitialised = true;
        
        let iface: any = window["nsWebViewInterface"];
        iface.on(
            'tupleStoragePromiseFinished',
            (argObj: any) => {
                let args: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("WEB: Received tupleStoragePromiseResolved event");
                TupleStorageBridgeWeb.promsById[args.promId][args.action](args.result);
                delete TupleStorageBridgeWeb.promsById[args.promId];
            }
        );
    }

    open(): Promise<void> {
        return Promise.resolve();
    }

    isOpen(): boolean {
        return true;
    }

    close(): void {
    }

    transaction(forWrite: boolean): Promise<TupleStorageTransaction> {
        return Promise.resolve(new Transaction(forWrite));
    }

}

class Transaction implements TupleStorageTransaction {
    private iface: any = window["nsWebViewInterface"];

    constructor(private forWrite: boolean) {

    }

    loadTuples(tupleSelector: TupleSelector): Promise<Tuple[]> {
        let promId = TupleStorageBridgeWeb.nextPromiseId++;

        return new Promise<Tuple[]>((resolve, reject) => {
            TupleStorageBridgeWeb.promsById[promId] = {
                "resolve": resolve,
                "reject": reject
            };

            let args: any = {
                promId: promId,
                tupleSelector: tupleSelector
            };

            let argObj = new Payload({}, args).toJsonDict();

            // Send events from the nativescript side service to the <webview> side
            console.log("WEB: Sending loadTuples event");
            this.iface.emit("loadTuples", argObj);

        });
    }

    saveTuples(tupleSelector: TupleSelector, tuples: Tuple[]): Promise<void> {
        let promId = TupleStorageBridgeWeb.nextPromiseId++;

        return new Promise<void>((resolve, reject) => {
            TupleStorageBridgeWeb.promsById[promId] = {
                "resolve": resolve,
                "reject": reject
            };

            let args: any = {
                promId: promId,
                tupleSelector: tupleSelector,
                tuples: tuples
            };

            let argObj = new Payload({}, args).toJsonDict();


            // Send events from the nativescript side service to the <webview> side
            console.log("WEB: Sending saveTuples event");
            this.iface.emit("saveTuples", argObj);

        });
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

}