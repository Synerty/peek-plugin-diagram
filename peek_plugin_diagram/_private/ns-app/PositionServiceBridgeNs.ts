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
        positionService.positionObservable
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((pos: DiagramPositionI) => {
                console.log("NS: Sending position event");
                iface.emit("position", pos);
            });


    }


}