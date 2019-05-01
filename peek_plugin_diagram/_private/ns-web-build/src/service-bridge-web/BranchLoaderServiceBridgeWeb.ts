import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {
    BranchIndexLoaderServiceA,
    BranchIndexLoaderStatusTuple,
    BranchIndexResultI
} from "../@peek/peek_plugin_diagram/_private/branch-loader";
import {ServiceBridgeHandlerObserverSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerObservable";
import {ServiceBridgeHandlerCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerCall";
import {window} from "@angular/platform-browser/src/browser/tools/browser";
import {ServiceBridgeHandlerPromiseCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerPromise";
import {DiagramBranchContext} from "../@peek/peek_plugin_diagram";


@Injectable({
    providedIn: 'root'
})
export class BranchLoaderServiceBridgeWeb extends BranchIndexLoaderServiceA {

    private iface: window["nsWebViewInterface"];

    private handlers = [];

    private readonly isReadyObservableHandler: ServiceBridgeHandlerObserverSide;
    private readonly statusObservableHandler: ServiceBridgeHandlerObserverSide;

    private readonly getBranchesHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly saveBranchHandler: ServiceBridgeHandlerPromiseCallerSide;

    constructor() {
        super();


        // isReadyObservable
        this.isReadyObservableHandler = new ServiceBridgeHandlerObserverSide(
            'BranchLoaderBridge_isReadyObservable',
            false,
            true,
            false
        );
        this.handlers.push(this.isReadyObservableHandler);


        // statusObservable
        this.statusObservableHandler = new ServiceBridgeHandlerObserverSide(
            'BranchLoaderBridge_statusObservable',
            true,
            true,
            new BranchIndexLoaderStatusTuple()
        );
        this.handlers.push(this.statusObservableHandler);

        // getBranches
        this.getBranchesHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'BranchLoaderBridge_getBranches',
        );
        this.handlers.push(this.getBranchesHandler);

        // saveBranch
        this.saveBranchHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'BranchLoaderBridge_saveBranch',
        );
        this.handlers.push(this.saveBranchHandler);


        for (let handler of this.handlers) {
            handler.start(this.iface);
        }

    }


    isReady(): boolean {
        return this.isReadyObservableHandler.lastData;
    }

    isReadyObservable(): Observable<boolean> {
        return this.isReadyObservableHandler.observable;
    }

    status(): BranchIndexLoaderStatusTuple {
        return this.statusObservableHandler.lastData;
    }

    statusObservable(): Observable<BranchIndexLoaderStatusTuple> {
        return this.statusObservableHandler.observable;
    }

    getBranches(modelSetKey: string, keys: string[]): Promise<BranchIndexResultI> {
        return this.getBranchesHandler.call(modelSetKey, keys);
    }

    saveBranch(context: DiagramBranchContext): Promise<void> {
        // Send the branch, the context
        return this.saveBranchHandler.call(context["branch"]);
    }


}
