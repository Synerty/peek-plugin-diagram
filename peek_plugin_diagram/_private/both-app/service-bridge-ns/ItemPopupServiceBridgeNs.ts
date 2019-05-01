import {NgZone} from "@angular/core";
import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {
    DiagramItemDetailI,
    DiagramItemPopupContextI,
    DiagramMenuItemCallbackI,
    DiagramMenuItemI,
    PrivateDiagramItemPopupService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {
    ServiceBridgeHandlerCalleeSide,
    ServiceBridgeHandlerCallerSide
} from "../service-bridge-util/ServiceBridgeHandlerCall";

export class ItemPopupServiceBridgeNs {

    private handlers = [];

    private readonly addMenuItemHandler: ServiceBridgeHandlerCallerSide;
    private readonly addDetailItemsHandler: ServiceBridgeHandlerCallerSide;


    private lastMenuCallbacks: { [num: number]: any } = {};
    private lastMenuCallbackNum = 0;

    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private zone: NgZone,
                private service: PrivateDiagramItemPopupService,
                private iface: WebViewInterface) {


        // emitPopupContext
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'ItemPopupServiceBridge.emitPopupContext',
            false,
            this.emitPopupContextReceived
        ));


        // setTitle
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'ItemPopupServiceBridge.setPopupShown',
            false,
            this.service.setPopupShown
        ));

        // DiagramItemPopupContextI.addMenuItem
        this.addMenuItemHandler = new ServiceBridgeHandlerCallerSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.addMenuItem',
            false
        );
        this.handlers.push(this.addMenuItemHandler);

        // DiagramItemPopupContextI.addDetailItems
        this.addDetailItemsHandler = new ServiceBridgeHandlerCallerSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.addDetailItems',
            false
        );
        this.handlers.push(this.addDetailItemsHandler);

        // DiagramItemPopupContextI.menuCallback
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.menuCallback',
            false,
            this.handleMenuCallback
        ));


        for (let handler of this.handlers) {
            handler.start(iface);
        }
    }

    private setPopupShownReceived(value: boolean) {
        if (!value) {
            this.lastMenuCallbacks = {};
        }

        this.service.setPopupShown(value);
    }

    private emitPopupContextReceived(context: DiagramItemPopupContextI,
                                     contextNum: number) {

        context.addMenuItem = (menuItem: DiagramMenuItemI) => {
            this.storeAddMenuCallbacks([menuItem]);
            this.addMenuItemHandler.call(menuItem, contextNum);

        };
        context.O = (details: DiagramItemDetailI[]) => {
            this.addDetailItemsHandler.call(details, contextNum);

        };

        this.service.emitPopupContext(context);

    }

    private handleMenuCallback(callbackNum: number) {
        let callback = this.lastMenuCallbacks[callbackNum];
        if (callback != null)
            callback();

    }

    private storeAddMenuCallbacks(menuItems: DiagramMenuItemI[]) {
        if (menuItems == null)
            return;

        for (let menuItem of menuItems) {
            if (menuItem.callback != null) {
                let callbackNum = this.lastMenuCallbackNum++;
                this.lastMenuCallbacks[callbackNum] = menuItem.callback;
                menuItem.callback = callbackNum;
            }

            this.storeAddMenuCallbacks(menuItem.children);
        }

    }

}