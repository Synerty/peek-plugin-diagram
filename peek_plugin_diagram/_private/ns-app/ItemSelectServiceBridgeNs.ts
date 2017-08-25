import {WebViewInterface} from 'nativescript-webview-interface';
import {DiagramItemSelectService} from "@peek/peek_plugin_diagram";

export class ItemSelectServiceBridgeNs {
    constructor(private service: DiagramItemSelectService,
                private iface: WebViewInterface) {

    }

}