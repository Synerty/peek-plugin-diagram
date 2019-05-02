import {Payload, TupleActionABC} from "@synerty/vortexjs";
import {ServiceBridgeHandlerPromiseCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerPromise";
import {TupleActionStorageServiceABC} from "@synerty/vortexjs/src/vortex/action-storage/TupleActionStorageServiceABC";


export class TupleActionBridgeWeb extends TupleActionStorageServiceABC {

    private handlers = [];

    private readonly countActionsHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly deleteActionsHandler: ServiceBridgeHandlerPromiseCallerSide;
    private readonly storeActionHandler: ServiceBridgeHandlerPromiseCallerSide;

    constructor() {
        super();
        let iface: any = window["nsWebViewInterface"];

        // countActions
        this.countActionsHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleActionBridge_countActions'
        );
        this.handlers.push(this.countActionsHandler);

        // deleteActions
        this.deleteActionsHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleActionBridge_deleteActions'
        );
        this.handlers.push(this.deleteActionsHandler);

        // storeAction
        this.storeActionHandler = new ServiceBridgeHandlerPromiseCallerSide(
            'TupleActionBridge_storeAction',
            false
        );
        this.handlers.push(this.storeActionHandler);

        for (let handler of this.handlers) {
            handler.start(iface);
        }
    }

    countActions(): Promise<number> {
        return this.countActionsHandler.call();
    }

    deleteAction(scope: string, actionUuid: number): Promise<void> {
        return this.deleteActionsHandler.call(scope, actionUuid);
    }

    loadNextAction(): Promise<Payload> {
        // This is only needed by NS, as NS is the one sending the actions to the server.
        console.log("ERROR: TupleActionBridgeWeb.loadNextAction not implemented");
        throw new Error("TupleActionBridgeWeb.loadNextAction not implemented");
    }

    storeAction(scope: string, tupleAction: TupleActionABC, payload: Payload): Promise<void> {
        return this.storeActionHandler.call(scope, tupleAction, payload);
    }


}
