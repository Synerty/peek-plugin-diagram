import {Component, OnInit} from '@angular/core';
import {VortexService} from "@synerty/vortexjs";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    coordSetId: number | null = null;

    private oWebViewInterface:any;


    constructor(private vortexService: VortexService) {
    }

    ngOnInit() {
        // let vars = {};
        // window.location.href.replace(
        //     /[?&]+([^=&]+)=([^&]*)/gi,
        //     (m, key, value) =>  vars[key] = value
        // );
        //
        // let vortexWsUrl: string | null = vars['vortexWsUrl'];
        // let coordSetId: string | null = vars['coordSetId'];
        //
        // if (vortexWsUrl != null) {
        //     VortexService.setVortexUrl(vortexWsUrl);
        //     this.vortexService.reconnect();
        // }
        //
        // if (coordSetId != null) {
        //     this.coordSetId = parseInt(coordSetId);
        // }
        //
        // this.oWebViewInterface = window["nsWebViewInterface"];
        //
        // this.oWebViewInterface.on('webFunctionName',
        //     (someData:string)  => {
        //     console.log("WEB:Received message : " + someData)
        // });
        //
        // this.oWebViewInterface.emit('nsFunctionName', "Hello from WebView");
    }

}
