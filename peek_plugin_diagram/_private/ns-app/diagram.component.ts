import {Component, ViewChild, OnInit} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {WebViewInterface} from 'nativescript-webview-interface';
import {LoadEventData, WebView} from 'ui/web-view';


@Component({
    selector: 'plugin-diagram',
    templateUrl: 'diagram.component.html',
    moduleId: module.id
})
export class DiagramComponent extends ComponentLifecycleEventEmitter
implements OnInit{

    coordSetId: number | null = 2;

    private wsUrl: string = '';
    private httpUrl: string = '';

    private oLangWebViewInterface: WebViewInterface;

    @ViewChild('webView') webView;

    constructor(private enrolmentService: DeviceEnrolmentService) {
        super();
        let host = this.enrolmentService.serverHost;

        let httpProtocol = this.enrolmentService.serverUseSsl ? 'https' : 'http';
        let httpPort = this.enrolmentService.serverHttpPort;

        let wsProtocol = this.enrolmentService.serverUseSsl ? 'wss' : 'ws';
        let wsPort = this.enrolmentService.serverWebsocketPort;

        this.httpUrl = `${httpProtocol}://${host}:${httpPort}/${diagramBaseUrl}/web_dist`;
        this.wsUrl = `${wsProtocol}://${host}:${wsPort}/vortexws`;

        // this.onDestroyEvent.subscribe(() => this.oLangWebViewInterface.destroy())

    }

    ngOnInit() {
        let webView = <WebView>this.webView.nativeElement;
        this.oLangWebViewInterface = new WebViewInterface(webView, this.webViewUrl());

        // loading languages in dropdown, on load of webView content.
        this.oLangWebViewInterface.on('nsFunctionName',
            (message:string) => {
            console.log("NS:Received : " + message);

            this.oLangWebViewInterface.emit(
                "webFunctionName",
                "Hello from NS"
            );
        });
    }

    webViewUrl(): string {
        let url = this.httpUrl;
        // let url = '~/assets/peek_plugin_diagram/www/index.html';
        url += `?coordSetId=${this.coordSetId}`;
        url += `&vortexWsUrl=${this.wsUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }


}
