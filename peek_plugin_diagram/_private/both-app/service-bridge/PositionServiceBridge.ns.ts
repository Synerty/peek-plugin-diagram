import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    DiagramPositionPrivateService
} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class PositionServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramPositionService,
                private iface: WebViewInterface) {

        let positionService = <DiagramPositionPrivateService> service;

        // Send events from the nativescript side service to the <webview> side
        positionService.positionSubject
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((pos: DiagramPositionI) => {
                console.log("NS: Sending positionSubject event");
                iface.emit("positionSubject", pos);
            });

        // Send events from the nativescript side service to the <webview> side
        positionService.positionInitialSubject
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((coordSetKey: string) => {
                console.log("NS: Sending positionInitialSubject event");
                iface.emit("positionInitialSubject", coordSetKey);
            });

        // Listen for calls from the <webview> site
        this.iface.on(
            'isReadySubject',
            (val: boolean) => {
                console.log(`NS: Received isReadySubject event ${val}`);
                positionService.isReadySubject.next(val);
            }
        );

        // Listen for calls from the <webview> site
        this.iface.on(
            'titleUpdatedSubject',
            (val: string) => {
                console.log(`NS: Received titleUpdatedSubject event ${val}`);
                positionService.titleUpdatedSubject.next(val);
            }
        );

    }

}