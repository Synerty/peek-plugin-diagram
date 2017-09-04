import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    DiagramPositionPrivateService
} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class PositionServiceBridgeWeb {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramPositionService,
                private iface: any) {

        let positionService = <DiagramPositionPrivateService> service;

        // Listen for calls from the NS site
        this.iface.on(
            'positionSubject',
            (pos: DiagramPositionI) => {
                console.log("WEB: Received positionSubject event");
                service.position(pos.coordSetKey, pos.x, pos.y, pos.zoom);
            }
        );

        // Listen for calls from the NS site
        this.iface.on(
            'positionInitialSubject',
            (coordSetKey: string) => {
                console.log("WEB: Received positionInitialSubject event");
                service.positionInitial(coordSetKey);
            }
        );

        // Send events from the <webview> side to the nativescript side service
        positionService.isReadySubject
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val) => {
                console.log(`WEB: Sending isReadySubject ${val}`);
                iface.emit("isReadySubject", val);
            });

        // Send events from the <webview> side to the nativescript side service
        positionService.titleUpdatedSubject
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val:string) => {
                console.log(`WEB: Sending titleUpdatedSubject ${val}`);
                iface.emit("titleUpdatedSubject", val);
            });

    }

}