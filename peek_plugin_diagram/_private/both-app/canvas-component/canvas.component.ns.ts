import {Component, Input, OnInit, ViewChild} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';

import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramItemPopupPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramToolbarPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";


import {
    DiagramPositionI,
    DiagramPositionPrivateService
} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";
import {ItemSelectServiceBridgeNs} from "../service-bridge/ItemSelectServiceBridge.ns";
import {PositionServiceBridgeNs} from "../service-bridge/PositionServiceBridge.ns";

@Component({
    selector: 'pl-diagram-canvas',
    templateUrl: 'canvas.component.ns.html',
    moduleId: module.id
})
export class CanvasComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    private oLangWebViewInterface: WebViewInterface;

    private itemSelectServiceBridge: ItemSelectServiceBridgeNs | null = null;
    private positionServiceBridge: PositionServiceBridgeNs | null = null;

    private privatePositionService: DiagramPositionPrivateService;

    @ViewChild('webView') webView;

    @Input("modelSetKey")
    modelSetKey: string;

    constructor(private enrolmentService: DeviceEnrolmentService,
                private privateItemSelectService: DiagramItemSelectPrivateService,
                positionService: DiagramPositionService) {
        super();

        this.privatePositionService = <DiagramPositionPrivateService> positionService;


    }

    ngOnInit() {

        let webView = <WebView>this.webView.nativeElement;

        this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());
        this.onDestroyEvent
            .subscribe(() => this.oLangWebViewInterface.destroy());


        this.itemSelectServiceBridge = new ItemSelectServiceBridgeNs(
            this, this.privateItemSelectService, this.oLangWebViewInterface
        );

        this.positionServiceBridge = new PositionServiceBridgeNs(
            this, this.privatePositionService, this.oLangWebViewInterface
        );

    }

    private webViewUrl(): string {
        let url = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist`;
        let wsVortexUrl = this.enrolmentService.serverWebsocketVortexUrl;
        // let url = '~/assets/peek_plugin_diagram/www/index.html';
        // let url = "http://10.211.55.14:4200";
        url += `?modelSetKey=${this.modelSetKey}`;
        url += `&vortexWsUrl=${wsVortexUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
