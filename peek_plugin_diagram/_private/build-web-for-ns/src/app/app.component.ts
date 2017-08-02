import {Component} from '@angular/core';
import {VortexService} from "@synerty/vortexjs";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    coordSetId: number | null = null;

    constructor(private vortexService: VortexService) {
    }

    ngOnInit() {
        let vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (m, key, value) =>  vars[key] = value
        );

        let vortexWsUrl: string | null = vars['vortexWsUrl'];
        let coordSetId: string | null = vars['coordSetId'];

        if (vortexWsUrl != null) {
            VortexService.setVortexUrl(vortexWsUrl);
            this.vortexService.reconnect();
        }

        if (coordSetId != null) {
            this.coordSetId = parseInt(coordSetId);
        }

    }

}
