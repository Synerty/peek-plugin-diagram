import {Component, OnInit} from '@angular/core';
import {ComponentLifecycleEventEmitter, VortexService} from "@synerty/vortexjs";
import {PositionServiceBridgeWeb} from "../service-bridge/PositionServiceBridgeWeb";
import {ItemSelectServiceBridgeWeb} from "../service-bridge/ItemSelectServiceBridgeWeb";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {GridLoaderBridgeWeb} from "../service-bridge/GridLoaderBridgeWeb";
import {GridLoader} from "../peek_plugin_diagram/cache/GridLoader";

@Component({
    selector: 'ns-web-diagram',
    templateUrl: './ns-web-diagram.component.html'
})
export class NsWebDiagramComponent extends ComponentLifecycleEventEmitter implements OnInit {

    modelSetKey: string | null = null;

    private oWebViewInterface: any;
    private itemSelectServiceBridge: ItemSelectServiceBridgeWeb | null = null;
    private positionServiceBridge: PositionServiceBridgeWeb | null = null;

    constructor(private vortexService: VortexService,
                private positionService: DiagramPositionService,
                private itemSelectService: PrivateDiagramItemSelectService) {
        super();

    }

    ngOnInit() {
        // Setup the connection to the server, and the coord set.

        let vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (m, key, value) => vars[key] = value
        );

        this.modelSetKey = vars['modelSetKey'];
        let vortexWsUrl: string | null = vars['vortexWsUrl'];

        if (vortexWsUrl != null) {
            VortexService.setVortexUrl(vortexWsUrl);
            this.vortexService.reconnect();
        }


        if (this.modelSetKey == null || this.modelSetKey.length == 0) {
            alert("modelSetKey set is empty or null");
            throw new Error("modelSetKey set is empty or null");
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
