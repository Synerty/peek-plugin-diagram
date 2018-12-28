import {SelectedItemDetailsI} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


@Injectable()
export class ItemSelectServiceBridgeWeb extends ComponentLifecycleEventEmitter {

    private iface: window["nsWebViewInterface"];

    constructor() {
        super();

    }


    selectItem(details: SelectedItemDetailsI): void {
        console.log("WEB: Sending itemSelect event");
        this.iface.emit("ItemSelectService.itemSelected", item);
    }

}