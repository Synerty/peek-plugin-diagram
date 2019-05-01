import {
    DiagramBranchService,
    BranchUpdatedI
} from "@peek/peek_plugin_diagram/DiagramBranchContext";

import {
    DiagramBranchI,
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramBranchServiceContext";

import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramBranchContext} from "@peek/peek_plugin_diagram/DiagramBranchContext";


export class BranchServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramBranchService,
                private iface: WebViewInterface) {

        let privateService = <PrivateDiagramBranchService>service;

        // Send events from the nativescript side service to the <webview> side
        privateService.startEditingObservable
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((context: DiagramBranchContext) => {
                let params = {
                    modelSetKey: context.modelSetKey,
                    coordSetKey: context.coordSetKey,
                    branchKey: context.key,
                    location: context.location
                };
                console.log("NS: Sending startEditing event");
                iface.emit("BranchService.startEditing", params);
            });

        // Send events from the nativescript side service to the <webview> side
        privateService.stopEditingObservable
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe(() => {
                console.log("NS: Sending stopEditing event");
                iface.emit("BranchService.stopEditing");
            });


    }

}