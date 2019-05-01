import {NgZone} from "@angular/core";
import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {
    PrivateDiagramItemPopupService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {Subject} from "rxjs/Subject";

export class ItemPopupServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private zone: NgZone,
                private service: PrivateDiagramItemPopupService,
                private iface: WebViewInterface) {

        // TODO
    }

}