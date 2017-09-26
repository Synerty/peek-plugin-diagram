import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class PositionServiceBridgeWeb {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramPositionService,
                private iface: any) {

        let positionService = <PrivateDiagramPositionService> service;

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
        positionService.isReadyObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val) => {
                console.log(`WEB: Sending isReadySubject ${val}`);
                iface.emit("isReadySubject", val);
            });

        // Send events from the <webview> side to the nativescript side service
        positionService.titleUpdatedObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val:string) => {
                console.log(`WEB: Sending titleUpdatedSubject ${val}`);
                iface.emit("titleUpdatedSubject", val);
            });

    }

}