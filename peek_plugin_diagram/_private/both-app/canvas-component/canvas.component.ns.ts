import {Component, Input, OnInit, ViewChild, NgZone} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter,
TupleOfflineStorageService} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';

import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {GridLoaderA} from "../cache/GridLoader";


import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {ItemSelectServiceBridgeNs} from "../service-bridge/ItemSelectServiceBridge.ns";
import {PositionServiceBridgeNs} from "../service-bridge/PositionServiceBridge.ns";
import {TupleStorageBridgeNs} from "../service-bridge/TupleStorageBridge.ns";
import {GridLoaderBridgeNs} from "../service-bridge/GridLoaderBridge.ns";

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
    private tupleStorageBridge: TupleStorageBridgeNs | null = null;
    private gridLoaderBridge: GridLoaderBridgeNs | null = null;

    private privatePositionService: PrivateDiagramPositionService;

    @ViewChild('webView') webView;

    @Input("modelSetKey")
    modelSetKey: string;

    constructor(private zone: NgZone,
                private enrolmentService: DeviceEnrolmentService,
                private tupleStorage: TupleOfflineStorageService,
                private privateItemSelectService: PrivateDiagramItemSelectService,
                positionService: DiagramPositionService,
                private gridLoader: GridLoaderA) {
        super();

        this.privatePositionService = <PrivateDiagramPositionService> positionService;


    }

    ngOnInit() {

        let webView = <WebView>this.webView.nativeElement;

        this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());
        this.onDestroyEvent
            .subscribe(() => this.oLangWebViewInterface.destroy());

        this.itemSelectServiceBridge = new ItemSelectServiceBridgeNs(
            this, this.zone, this.privateItemSelectService, this.oLangWebViewInterface
        );

        this.positionServiceBridge = new PositionServiceBridgeNs(
            this, this.zone, this.privatePositionService, this.oLangWebViewInterface
        );

        this.tupleStorageBridge = new TupleStorageBridgeNs(
            this.tupleStorage, this.oLangWebViewInterface
        );

        this.gridLoaderBridge = new GridLoaderBridgeNs(
            this, this.gridLoader, this.oLangWebViewInterface
        );

    }

    private webViewUrl(): string {
        // let url = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist`;
        let url = `~/assets/peek_plugin_diagram/www/index.html`;
        let wsVortexUrl = this.enrolmentService.serverWebsocketVortexUrl;
        url += `?modelSetKey=${this.modelSetKey}`;
        url += `&vortexWsUrl=${wsVortexUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
