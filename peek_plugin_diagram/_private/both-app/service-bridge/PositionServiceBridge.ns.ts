import {NgZone} from "@angular/core";
import {DiagramPositionService, PositionUpdatedI} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class PositionServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private zone: NgZone,
                private service: DiagramPositionService,
                private iface: WebViewInterface) {

        let positionService = <PrivateDiagramPositionService> service;

        // Send events from the nativescript side service to the <webview> side
        positionService.positionObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((pos: DiagramPositionI) => {
                console.log("NS: Sending positionSubject event");
                iface.emit("positionSubject", pos);
            });

        // Send events from the nativescript side service to the <webview> side
        positionService.positionByCoordSetObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((coordSetKey: string) => {
                console.log("NS: Sending positionByCoordSetObservable event");
                iface.emit("positionByCoordSetObservable", coordSetKey);
            });

        // Listen for calls from the <webview> site
        this.iface.on(
            'isReadySubject',
            (val: boolean) => {
                console.log(`NS: Received isReadySubject event ${val}`);
                this.zone.run(() => {
                    positionService.setReady(val);
                });
            }
        );

        // Listen for calls from the <webview> site
        this.iface.on(
            'positionUpdated',
            (val: PositionUpdatedI) => {
                console.log(`NS: Received positionUpdated event`);
                this.zone.run(() => {
                    positionService.positionUpdated(val);
                });
            }
        );

        // Listen for calls from the <webview> site
        this.iface.on(
            'titleUpdatedSubject',
            (val: string) => {
                console.log(`NS: Received titleUpdatedSubject event ${val}`);
                this.zone.run(() => {
                    positionService.setTitle(val);
                });
            }
        );


        lifeCycleEvents.onDestroyEvent
            .subscribe(() => {
                // this.iface.off('positionUpdated');
                // this.iface.off('titleUpdatedSubject');
                // this.iface.off('isReadySubject');
            });

    }

}