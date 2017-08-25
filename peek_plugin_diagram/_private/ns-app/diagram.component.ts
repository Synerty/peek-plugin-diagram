import {Component, Input, OnInit, ViewChild} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';
import {PositionServiceBridgeNs} from "./PositionServiceBridgeNs";
import {ItemSelectServiceBridgeNs} from "./ItemSelectServiceBridgeNs";
import {
    DiagramItemSelectService,
    DiagramPositionService,
    DiagramToolbarService
} from "@peek/peek_plugin_diagram";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.html',
    moduleId: module.id
})
export class DiagramComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("coordSetId")
    coordSetId: number | null = null;

    private wsUrl: string = '';
    private httpUrl: string = '';

    private oLangWebViewInterface: WebViewInterface;

    private itemSelectServiceBridge: ItemSelectServiceBridgeNs | null = null;
    private positionServiceBridge: PositionServiceBridgeNs | null = null;

    @ViewChild('webView') webView;

    constructor(private enrolmentService: DeviceEnrolmentService,
                private itemSelectService: DiagramItemSelectService,
                private positionService: DiagramPositionService,
                private toolbarService: DiagramToolbarService) {
        super();
        this.httpUrl = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist`;
        this.wsUrl = `${this.enrolmentService.serverWebsocketUrl}/vortexws`;

        // this.onDestroyEvent.subscribe(() => this.oLangWebViewInterface.destroy())

    }

    ngOnInit() {
        let webView = <WebView>this.webView.nativeElement;

        if (webView["android"] != null) {
            console.log("ENABLING ANDROID DATABASE");
            webView["android"]["getSettings"]()["setDatabaseEnabled"](true);
        }

        this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());

        // loading languages in dropdown, on load of webView content.
        this.oLangWebViewInterface.on('nsFunctionName',
            (message: string) => {
                console.log("NS:Received : " + message);

                this.oLangWebViewInterface.emit(
                    "webFunctionName",
                    "Hello from NS"
                );
            });


        this.itemSelectServiceBridge = new ItemSelectServiceBridgeNs(
            this.itemSelectService, this.oLangWebViewInterface
        );

        this.positionServiceBridge = new PositionServiceBridgeNs(
            this.positionService, this.oLangWebViewInterface
        );

    }

    webViewUrl(): string {
        // let url = this.httpUrl;
        // let url = '~/assets/peek_plugin_diagram/www/index.html';
        let url = "http://10.211.55.14:4200";
        url += `?coordSetId=${this.coordSetId}`;
        url += `&vortexWsUrl=${this.wsUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
