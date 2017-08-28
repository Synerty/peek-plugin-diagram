import {Component, Input, OnInit, ViewChild} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';
import {PositionServiceBridgeNs} from "./PositionServiceBridgeNs";
import {ItemSelectServiceBridgeNs} from "./ItemSelectServiceBridgeNs";
import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.html',
    moduleId: module.id
})
export class DiagramComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("coordSetId")
    coordSetId: number | null = null;

    private lastCoordSetId: number | null = null;

    private oLangWebViewInterface: WebViewInterface;

    private itemSelectServiceBridge: ItemSelectServiceBridgeNs | null = null;
    private positionServiceBridge: PositionServiceBridgeNs | null = null;

    @ViewChild('webView') webView;

    constructor(private enrolmentService: DeviceEnrolmentService,
                private itemSelectService: DiagramItemSelectPrivateService,
                private itemPopupService: DiagramItemPopupService,
                private positionService: DiagramPositionService,
                private toolbarService: DiagramToolbarService) {
        super();

    }

    ngOnInit() {

        // Watch the coordSetId
        let sub = this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                if (this.lastCoordSetId == this.coordSetId)
                    return;

                if (this.coordSetId == null)
                    return;

                this.lastCoordSetId = this.coordSetId;

                // We only take one update
                sub.unsubscribe();

                let webView = <WebView>this.webView.nativeElement;

                // if (webView["android"] != null) {
                //     console.log("ENABLING ANDROID DATABASE");
                //     webView["android"]["getSettings"]()["setDatabaseEnabled"](true);
                // }

                this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());
                this.onDestroyEvent
                    .subscribe(() => this.oLangWebViewInterface.destroy());


                this.itemSelectServiceBridge = new ItemSelectServiceBridgeNs(
                    this, this.itemSelectService, this.oLangWebViewInterface
                );

                this.positionServiceBridge = new PositionServiceBridgeNs(
                    this, this.positionService, this.oLangWebViewInterface
                );

            });

    }

    webViewUrl(): string {
        let url = `${this.enrolmentService.serverHttpUrl}/${diagramBaseUrl}/web_dist`;
        let wsVortexUrl = this.enrolmentService.serverWebsocketVortexUrl;
        // let url = '~/assets/peek_plugin_diagram/www/index.html';
        // let url = "http://10.211.55.14:4200";
        url += `?coordSetId=${this.coordSetId}`;
        url += `&vortexWsUrl=${wsVortexUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
