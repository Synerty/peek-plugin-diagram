import {WebViewInterface} from 'nativescript-webview-interface';
import {Payload, TupleOfflineStorageService} from "@synerty/vortexjs";
import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    PrivateDiagramTupleService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";

export class TupleStorageBridgeNs {
    constructor(private tupleService: PrivateDiagramTupleService,
                private iface: WebViewInterface) {

        this.iface.on(
            'loadTuplesEncoded',
            (argObj: any) => {
                let args: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("NS: Received loadTuples event");
                this.handlePromise(
                    this.tupleService.offlineStorage.loadTuplesEncoded(args.tupleSelector),
                    args.promId
                );

            }
        );

        this.iface.on(
            'saveTuplesEncoded',
            (argObj: any) => {
                let args: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("NS: Received saveTuples event");
                this.handlePromise(
                    this.tupleService.offlineStorage.saveTuplesEncoded(args.tupleSelector, args.encodedPayload),
                    args.promId
                );

            }
        );
    }

    handlePromise(promise, promId): void {
        promise
            .then((tuples) => this.resolveReject(tuples, promId, 'resolve'))
            .catch((e) => this.resolveReject(e.toString(), promId, 'reject'));
    }

    resolveReject(result, promId, action): void {
        let args: any = {
            promId: promId,
            action: action,
            result: result
        };

        let argObj = new Payload({}, args).toJsonDict();

        // Send events from the nativescript side service to the <webview> side
        console.log("NS: Sending resolve event");
        this.iface.emit("tupleStoragePromiseFinished", argObj);

    }


}