import {NgZone} from "@angular/core";
import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {Subject} from "rxjs/Subject";

export class ItemSelectServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private zone: NgZone,
                private service: PrivateDiagramItemSelectService,
                private iface: WebViewInterface) {

        this.iface.on(
            'itemSelected',
            (item: SelectedItemDetailsI) => {
                console.log("NS: Received item select event");
                this.zone.run(() => {
                    service.selectItem(item);
                });
            }
        );
    }

}