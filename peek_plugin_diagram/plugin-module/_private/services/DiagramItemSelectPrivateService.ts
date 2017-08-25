import {Injectable} from "@angular/core";
import {
    DiagramItemPopupContextI,
    DiagramItemSelectService
} from "@peek/peek_plugin_diagram/DiagramItemSelectService";
import {Subject} from "rxjs";


@Injectable()
export class DiagramItemSelectPrivateService extends DiagramItemSelectService {
    constructor() {
        super();

    }
    itemSelectObserver(coordSetKey): Subject<DiagramItemPopupContextI> {
        return undefined;
    }

}