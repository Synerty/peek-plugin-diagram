import {WebViewInterface} from 'nativescript-webview-interface';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {
    DiagramItemSelectPrivateService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {Subject} from "rxjs";

export class ItemSelectServiceBridgeNs {
    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private service: DiagramItemSelectPrivateService,
                private iface: WebViewInterface) {

        this.iface.on(
            'itemSelected',
            (item: SelectedItemDetailsI) => {
                let subject = <Subject<SelectedItemDetailsI>> service.itemSelectObservable();
                console.log("NS: Received position event");
                subject.next(item);
            }
        );
    }

}