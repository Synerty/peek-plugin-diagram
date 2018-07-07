import {
    DiagramPositionService,
    PositionUpdatedI
} from "@peek/peek_plugin_diagram/DiagramPositionService";

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
                service.position(pos.coordSetKey, pos.x, pos.y, pos.zoom, pos.highlightKey);
            }
        );

        // Listen for calls from the NS site
        this.iface.on(
            'positionByCoordSetObservable',
            (coordSetKey: string) => {
                console.log("WEB: Received positionByCoordSetObservable event");
                service.positionByCoordSet(coordSetKey);
            }
        );

        lifeCycleEvents.onDestroyEvent
            .subscribe(() => {
                this.iface.off('positionSubject');
                this.iface.off('positionByCoordSetObservable');
            });

        // Send events from the <webview> side to the nativescript side service
        positionService.isReadyObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val) => {
                console.log(`WEB: Sending isReadySubject ${val}`);
                iface.emit("isReadySubject", val);
            });

        // Send events from the <webview> side to the nativescript side service
        positionService.positionUpdatedObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val: PositionUpdatedI) => {
                console.log(`WEB: Sending positionUpdated`);
                iface.emit("positionUpdated", val);
            });

        // Send events from the <webview> side to the nativescript side service
        positionService.titleUpdatedObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((val: string) => {
                console.log(`WEB: Sending titleUpdatedSubject ${val}`);
                iface.emit("titleUpdatedSubject", val);
            });

    }

}