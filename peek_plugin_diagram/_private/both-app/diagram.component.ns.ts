import {Component} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";

@Component({
    selector: 'plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    moduleId: module.id
})
export class DiagramComponent {

    coordSetId: number | null = 2;

    private wsUrl:string = '';
    private httpUrl:string = '';

    constructor(private enrolmentService: DeviceEnrolmentService) {
        let host = this.enrolmentService.serverHost;

        let httpProtocol = this.enrolmentService.serverUseSsl ? 'https' : 'http';
        let httpPort = this.enrolmentService.serverHttpPort;

        let wsProtocol = this.enrolmentService.serverUseSsl ? 'wss' : 'ws';
        let wsPort = this.enrolmentService.serverWebsocketPort;

        this.httpUrl=`${httpProtocol}://${host}:${httpPort}/${diagramBaseUrl}/web_dist`;
        this.wsUrl = `${wsProtocol}://${host}:${wsPort}/vortexws`;

    }

    webViewUrl(): string {
        let url = this.httpUrl;
        url += `?coordSetId=${this.coordSetId}`;
        url += `&vortexWsUrl=${this.wsUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }

}
