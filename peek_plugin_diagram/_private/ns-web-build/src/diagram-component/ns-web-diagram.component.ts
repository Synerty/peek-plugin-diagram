import {Component, OnInit} from '@angular/core';
import {ComponentLifecycleEventEmitter, VortexService} from "@synerty/vortexjs";
import {PositionServiceBridgeWeb} from "../service-bridge/PositionServiceBridgeWeb";
import {ItemSelectServiceBridgeWeb} from "../service-bridge/ItemSelectServiceBridgeWeb";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";

@Component({
    selector: 'ns-web-diagram',
    templateUrl: './ns-web-diagram.component.html'
})
export class NsWebDiagramComponent extends ComponentLifecycleEventEmitter implements OnInit {

    coordSetId: number | null = null;

    private oWebViewInterface: any;
    private itemSelectServiceBridge: ItemSelectServiceBridgeWeb | null = null;
    private positionServiceBridge: PositionServiceBridgeWeb | null = null;

    constructor(private vortexService: VortexService,
                private positionService: DiagramPositionService,
                private itemSelectService: DiagramItemSelectPrivateService) {
        super();
    }

    ngOnInit() {
        // Setup the connection to the server, and the coord set.

        let vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (m, key, value) => vars[key] = value
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


        // Setup the ns-web interface
        this.oWebViewInterface = window["nsWebViewInterface"];

        // Create the bridge handlers
        this.itemSelectServiceBridge = new ItemSelectServiceBridgeWeb(
            this, this.itemSelectService, this.oWebViewInterface
        );

        this.positionServiceBridge = new PositionServiceBridgeWeb(
            this, this.positionService, this.oWebViewInterface
        );


    }

}
