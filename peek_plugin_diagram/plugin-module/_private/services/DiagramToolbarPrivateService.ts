import {Injectable} from "@angular/core";
import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";


@Injectable()
export class DiagramToolbarPrivateService extends DiagramToolbarService {
    constructor() {
        super();

    }

    addToolButton(toolButton: DiagramToolButtonI) {
    }

}