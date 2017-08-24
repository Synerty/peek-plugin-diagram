import {Injectable} from "@angular/core";
import {DiagramItemSelectService} from "@peek/peek_plugin_diagram";

@Injectable()
export class ItemSelectServiceBridgeNs {
    constructor(private service:DiagramItemSelectService ) {

    }

}