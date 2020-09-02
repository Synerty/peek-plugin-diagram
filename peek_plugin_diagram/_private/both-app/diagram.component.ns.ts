import {AfterViewInit, Component, ViewChild} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import { TitleService } from "@synerty/peek-plugin-base-js"
import {DiagramComponentBase} from "./diagram.component";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";

import {WebViewInterface} from 'nativescript-webview-interface';
import {WebView} from 'ui/web-view';
import {PrivateDiagramGridLoaderServiceA} from "@peek/peek_plugin_diagram/_private/grid-loader";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";
import {PrivateDiagramBranchLoaderServiceA} from "@peek/peek_plugin_diagram/_private/branch-loader";


import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {PositionServiceBridgeNs} from "../service-bridge/PositionServiceBridge.ns";
import {TupleStorageBridgeNs} from "../service-bridge/TupleStorageBridge.ns";
import {GridLoaderBridgeNs} from "../service-bridge/GridLoaderBridge.ns";
import {BranchLoaderServiceBridgeNs} from "../service-bridge/BranchLoaderServiceBridge.ns";

import * as fs from "tns-core-modules/file-system";
import {TupleActionBridgeNs} from "./service-bridge-ns/TupleActionBridge.ns";
import {ItemPopupServiceBridgeNs} from "./service-bridge-ns/ItemPopupServiceBridge.ns";

@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.ns.html',
    styleUrls: ['diagram.component.ns.scss'],
    moduleId: module.id
})
export class DiagramComponent extends DiagramComponentBase
    implements AfterViewInit {

    private oLangWebViewInterface: WebViewInterface;

    private itemPopupServiceBridge: ItemPopupServiceBridgeNs | null = null;
    private positionServiceBridge: PositionServiceBridgeNs | null = null;
    private tupleStorageBridge: TupleStorageBridgeNs | null = null;
    private tupleActionBridge: TupleActionBridgeNs | null = null;
    private gridLoaderBridge: GridLoaderBridgeNs | null = null;
    private branchLoaderServiceBridge: BranchLoaderServiceBridgeNs | null = null;

    @ViewChild('webView', {static: true}) webView;


    constructor(titleService: TitleService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService,
                private enrolmentService: DeviceEnrolmentService,
                private tupleService: PrivateDiagramTupleService,
                private gridLoader: PrivateDiagramGridLoaderServiceA,
                private branchLoaderService: PrivateDiagramBranchLoaderServiceA) {
        super(titleService, itemPopupService, positionService, toolbarService);

        this.privatePositionService = <PrivateDiagramPositionService>positionService;


    }

    ngAfterViewInit() {

        let webView = <WebView>this.webView.nativeElement;

        this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());
        this.onDestroyEvent
            .subscribe(() => this.oLangWebViewInterface.destroy());

        this.itemPopupServiceBridge = new ItemPopupServiceBridgeNs(
            this, this.zone, this.itemPopupService, this.oLangWebViewInterface
        );

        this.positionServiceBridge = new PositionServiceBridgeNs(
            this, this.zone, this.privatePositionService, this.oLangWebViewInterface
        );

        this.tupleStorageBridge = new TupleStorageBridgeNs(
            this.tupleService, this.oLangWebViewInterface
        );

        this.tupleActionBridge = new TupleActionBridgeNs(
            this.tupleService, this.oLangWebViewInterface
        );

        this.gridLoaderBridge = new GridLoaderBridgeNs(
            this, this.gridLoader, this.oLangWebViewInterface
        );

        this.branchLoaderServiceBridge = new BranchLoaderServiceBridgeNs(
            this, this.branchLoaderService, this.oLangWebViewInterface
        );

    }

    private webViewUrl(): string {
        let liveSyncUrl = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist/index.html`;
        let appPath = fs.knownFolders.currentApp().path;
        let localUrl = `${appPath}/assets/peek_plugin_diagram/www/index.html`;

        let isLiveSync = appPath.indexOf("LiveSync") != -1;

        // For some reason the livesync doesn't sync the assets properly.
        // So in this case, just talk to the peek client service
        let url = isLiveSync ? liveSyncUrl : localUrl;

        if (isLiveSync) {
            alert(`This is in LiveSync, we going to use the server ${url}`);
        }

        url += `?modelSetKey=${this.modelSetKey}`;
        url = encodeURI(url);
        console.log(`Sending WebView to ${url}`);
        return url;
    }

}
