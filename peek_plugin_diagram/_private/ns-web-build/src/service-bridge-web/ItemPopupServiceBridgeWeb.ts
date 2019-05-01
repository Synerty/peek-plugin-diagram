import {SelectedItemDetailsI} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Injectable} from "@angular/core";


@Injectable({
    providedIn: 'root'
})
export class ItemPopupServiceBridgeWeb extends ComponentLifecycleEventEmitter {

    private iface= window["nsWebViewInterface"];

    constructor() {
        super();

    }



}