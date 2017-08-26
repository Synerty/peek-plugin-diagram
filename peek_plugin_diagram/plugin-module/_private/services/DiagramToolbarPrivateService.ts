import {Injectable} from "@angular/core";
import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "../../DiagramToolbarService";


@Injectable()
export class DiagramToolbarPrivateService extends DiagramToolbarService {
    constructor() {
        super();

    }

    addToolButton(toolButton: DiagramToolButtonI) {
    }

}