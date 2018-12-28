import {Component, OnInit} from '@angular/core';
import {ComponentLifecycleEventEmitter, VortexService} from "@synerty/vortexjs";
import {PositionServiceBridgeWeb} from "../service-bridge/PositionServiceBridgeWeb";
import {ItemSelectServiceBridgeWeb} from "../service-bridge/ItemSelectServiceBridgeWeb";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";

@Component({
    selector: 'ns-web-diagram',
    templateUrl: './ns-web-diagram.component.html'
})
export class NsWebDiagramComponent extends ComponentLifecycleEventEmitter implements OnInit {

    modelSetKey: string | null = null;

    constructor() {
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

        if (this.modelSetKey == null || this.modelSetKey.length == 0) {
            alert("modelSetKey set is empty or null");
            throw new Error("modelSetKey set is empty or null");
        }

    }

}
