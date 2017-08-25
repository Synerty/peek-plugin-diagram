import {DiagramPositionService} from "@peek/peek_plugin_diagram";
import {WebViewInterface} from 'nativescript-webview-interface';


export class PositionServiceBridgeNs {
    constructor(private service: DiagramPositionService,
                private iface: WebViewInterface) {

    }

}