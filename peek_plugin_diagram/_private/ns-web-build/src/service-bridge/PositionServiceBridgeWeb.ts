import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {DiagramPositionI} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class PositionServiceBridgeWeb {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramPositionService,
                private iface: any) {


        this.iface.on(
            'position',
            (pos: DiagramPositionI) => {
                console.log("WEB: Received position event");
                service.position(pos.coordSetKey, pos.x, pos.y, pos.zoom);
            }
        );

    }

}