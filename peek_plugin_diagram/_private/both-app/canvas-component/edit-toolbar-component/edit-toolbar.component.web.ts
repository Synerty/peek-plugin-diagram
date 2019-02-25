import {Component, Input} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {EditorToolType, PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-edit-toolbar',
    templateUrl: 'edit-toolbar.component.web.html',
    styleUrls: ['edit-toolbar.component.web.scss'],
    moduleId: module.id
})
export class EditToolbarComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    constructor() {
        super();

    }

    isSelectToolActive():boolean {
        return this.canvasEditor.selectedTool() === EditorToolType.SELECT_TOOL;
    }


}
