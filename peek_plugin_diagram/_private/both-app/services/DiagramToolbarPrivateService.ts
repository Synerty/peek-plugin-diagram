import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";

export function diagramToolbarPrivateServiceFactory(): DiagramToolbarService {
    return new DiagramToolbarPrivateService();
}

export class DiagramToolbarPrivateService extends DiagramToolbarService {
    addToolButton(toolButton: DiagramToolButtonI) {
    }

}