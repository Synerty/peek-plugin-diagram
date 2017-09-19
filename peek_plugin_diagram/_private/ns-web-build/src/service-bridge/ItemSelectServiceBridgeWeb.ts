import {
    DiagramItemSelectPrivateService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


export class ItemSelectServiceBridgeWeb {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramItemSelectPrivateService,
                private iface: any) {


        // Send events from the nativescript side service to the <webview> side
        service.itemSelectObservable()
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((item: SelectedItemDetailsI) => {

                console.log("WEB: Sending itemSelect event");
                iface.emit("itemSelected", item);
            });
    }

}