import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {PrivateDiagramBranchLoaderServiceA} from "@peek/peek_plugin_diagram/_private/branch-loader";
import {
    BranchTuple,
    PrivateDiagramBranchContext
} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";
import {ServiceBridgeHandlerObservableSide} from "../service-bridge-util/ServiceBridgeHandlerObservable";
import {ServiceBridgeHandlerPromiseCalleeSide} from "../service-bridge-util/ServiceBridgeHandlerPromise";

export class BranchLoaderServiceBridgeNs {

    private handlers = [];
    private readonly isReadyHandler: ServiceBridgeHandlerObservableSide;


    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private branchLoader: PrivateDiagramBranchLoaderServiceA,
                private iface: WebViewInterface) {

        // isReadyObservable
        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'BranchLoaderBridge_isReadyObservable',
            false,
            this.branchLoader.isReadyObservable,
            lifeCycleEvents
        ));

        // statusObservable
        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'BranchLoaderBridge_statusObservable',
            false,
            this.branchLoader.statusObservable,
            lifeCycleEvents
        ));

        // getBranches
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'BranchLoaderBridge_getBranches', true,
            this.branchLoader.getBranches,
        ));

        // saveBranch
        this.handlers.push(new ServiceBridgeHandlerPromiseCalleeSide(
            'BranchLoaderBridge_saveBranch', true,
            this._saveBranchFakeContext
        ));

        for (let handler of this.handlers) {
            handler.start(this.iface);
        }

    }

    private _saveBranchFakeContext(branchTuple: BranchTuple): Promise<void> {
        let fakeContext = new PrivateDiagramBranchContext(
            null, branchTuple, null, null
        );
        return this.branchLoader.saveBranch(fakeContext);
    }


}