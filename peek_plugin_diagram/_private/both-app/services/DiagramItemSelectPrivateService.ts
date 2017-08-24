import {
    DiagramItemPopupContextI,
    DiagramItemSelectService
} from "@peek/peek_plugin_diagram/DiagramItemSelectService";
import {Subject} from "rxjs";

export function diagramItemSelectPrivateServiceFactory(): DiagramItemSelectService {
    return new DiagramItemSelectPrivateService();
}

export class DiagramItemSelectPrivateService extends DiagramItemSelectService {
    itemSelectObserver(coordSetKey): Subject<DiagramItemPopupContextI> {
        return undefined;
    }

}