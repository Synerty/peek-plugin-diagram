import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {Subject} from "rxjs";

export class ItemSelectServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: PrivateDiagramItemSelectService,
                private iface: WebViewInterface) {

        this.iface.on(
            'itemSelected',
            (item: SelectedItemDetailsI) => {
                console.log("NS: Received position event");
                service.selectItem(item);
            }
        );
    }

}