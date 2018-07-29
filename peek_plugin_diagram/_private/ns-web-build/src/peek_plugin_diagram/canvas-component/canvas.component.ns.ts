import {Component, Input, NgZone, OnInit, ViewChild} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {
    ComponentLifecycleEventEmitter,
    TupleOfflineStorageService
} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';

import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {PrivateDiagramGridLoaderServiceA} from "@peek/peek_plugin_diagram/_private/grid-loader/PrivateDiagramGridLoaderServiceA";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";


import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {ItemSelectServiceBridgeNs} from "../service-bridge/ItemSelectServiceBridge.ns";
import {PositionServiceBridgeNs} from "../service-bridge/PositionServiceBridge.ns";
import {TupleStorageBridgeNs} from "../service-bridge/TupleStorageBridge.ns";
import {GridLoaderBridgeNs} from "../service-bridge/GridLoaderBridge.ns";


        import * as fs from "tns-core-modules/file-system";

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
                private tupleService: PrivateDiagramTupleService,
                private privateItemSelectService: PrivateDiagramItemSelectService,
                positionService: DiagramPositionService,
                private gridLoader: PrivateDiagramGridLoaderServiceA) {
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
            this.tupleService, this.oLangWebViewInterface
        );

        this.gridLoaderBridge = new GridLoaderBridgeNs(
            this, this.gridLoader, this.oLangWebViewInterface
        );

    }

    private webViewUrl(): string {
        // let url = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist/index.html`;

        let appPath = fs.knownFolders.currentApp().path;
        let url = `${appPath}/assets/peek_plugin_diagram/www/index.html`;
        url += `?modelSetKey=${this.modelSetKey}`;
        url = encodeURI(url);
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
