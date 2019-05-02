import {Component, OnInit} from '@angular/core';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramPositionService, PositionUpdatedI} from "../@peek/peek_plugin_diagram";
import {PrivateDiagramPositionService} from "../@peek/peek_plugin_diagram/_private/services";

@Component({
    selector: 'ns-web-diagram',
    templateUrl: './ns-web-diagram.component.html'
})
export class NsWebDiagramComponent extends ComponentLifecycleEventEmitter implements OnInit {

    modelSetKey: string | null = null;
    coordSetKey: string | null = null;

    constructor(private posService : DiagramPositionService) {
        super();

        let privatePosService = <PrivateDiagramPositionService> posService;

        privatePosService.positionUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((pos: PositionUpdatedI) => this.coordSetKey = pos.coordSetKey);

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
