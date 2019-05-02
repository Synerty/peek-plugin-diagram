import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Injectable} from "@angular/core";
import {
    DiagramItemDetailI,
    DiagramItemPopupContextI,
    DiagramMenuItemI
} from "../@peek/peek_plugin_diagram";
import {
    ServiceBridgeHandlerCalleeSide,
    ServiceBridgeHandlerCallerSide
} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerCall";


@Injectable({
    providedIn: 'root'
})
export class ItemPopupServiceBridgeWeb extends ComponentLifecycleEventEmitter {

    private handlers = [];
    private readonly emitPopupContextHandler: ServiceBridgeHandlerCallerSide;
    private readonly setPopupShownHandler: ServiceBridgeHandlerCallerSide;

    private readonly menuCallbackHandler: ServiceBridgeHandlerCallerSide;

    private lastContext: DiagramItemPopupContextI | null = null;
    private lastContextNum = 0;

    constructor() {
        super();

        let iface = window["nsWebViewInterface"];


        // emitPopupContext
        this.emitPopupContextHandler = new ServiceBridgeHandlerCallerSide(
            'ItemPopupServiceBridge.emitPopupContext',
            false
        );
        this.handlers.push(this.emitPopupContextHandler);

        // setPopupShown
        this.setPopupShownHandler = new ServiceBridgeHandlerCallerSide(
            'ItemPopupServiceBridge.setPopupShown',
            false
        );
        this.handlers.push(this.setPopupShownHandler);

        // DiagramItemPopupContextI.addMenuItem
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.addMenuItem',
            false,
            this.handleAddMenuItemCalled
        ));

        // DiagramItemPopupContextI.addDetailItems
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.addDetailItems',
            false,
            this.handleAddDetailItems
        ));

        // DiagramItemPopupContextI.addDetailItems
        this.menuCallbackHandler = new ServiceBridgeHandlerCallerSide(
            'ItemPopupServiceBridge.DiagramItemPopupContextI.menuCallback',
            false
        );
        this.handlers.push(this.menuCallbackHandler);


        for (let handler of this.handlers) {
            handler.start(iface);
        }

    }

    /** Item Popup Observable
     *
     * This method returns an observer for this coordSetKey, that is fired when the item
     * is selected.
     */
    // itemPopupObservable(): Observable<DiagramItemPopupContextI> {
    //     return this.itemPopupSubject;
    // }

    // popupShownObservable(): Observable<boolean> {
    //     return this.popupShownSubject;
    // }

    emitPopupContext(context: DiagramItemPopupContextI): void {
        let num = this.lastContextNum++;
        this.lastContext = context;

        // TODO, Convert to the context to something that can actually work across
        // the webview link
        this.emitPopupContextHandler.call(context, num);
    }

    setPopupShown(value: boolean): void {
        if (!value) {
            this.lastContext = null;
            this.lastContextNum = null;
        }
        this.emitPopupContextHandler.call(value);
    }

    private handleAddMenuItemCalled(menuItem: DiagramMenuItemI, contextNum: number) {
        if (this.lastContext == null || this.lastContextNum != contextNum)
            return;

        this.remapMenuItemCallbacks([menuItem]);
        this.lastContext.addMenuItem(menuItem);
    }

    private handleAddDetailItems(details: DiagramItemDetailI[], contextNum: number) {
        if (this.lastContext == null || this.lastContextNum != contextNum)
            return;

        this.lastContext.addDetailItems(details);
    }


    // Convert the callback number back into callbacks locally
    private remapMenuItemCallbacks(menuItems: DiagramMenuItemI[]) {
        if (menuItems == null)
            return;

        for (let menuItem of menuItems) {
            if (menuItem.callback != null) {
                let num = menuItem.callback;
                // We expect it to be a number assigned in the NS bridge
                menuItem.callback = () => this.menuCallbackHandler.call(num);
            }

            this.remapMenuItemCallbacks(menuItem.children);
        }

    }


}