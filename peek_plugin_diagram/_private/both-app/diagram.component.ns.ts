import {Component} from "@angular/core";

import {DeviceEnrolmentService} from "@peek/peek_core_device";
import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";

@Component({
    selector: 'plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    moduleId: module.id
})
export class DiagramComponent {

    constructor(private enrolmentService: DeviceEnrolmentService) {

    }

    webViewUrl(): string {
        let protocol = this.enrolmentService.serverUseSsl ? 'https' : 'http';
        let host = this.enrolmentService.serverHost;
        let port = this.enrolmentService.serverHttpPort;

        let url =  `${protocol}://${host}:${port}/${diagramBaseUrl}`;
        console.log(`Sending WebView to ${url}`);
        return url;
    }

}
