import {Component, Input, NgZone, OnInit, ViewChild} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";


import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-edit-dynamic-properties',
    templateUrl: 'edit-dynamic-properties.component.html',
    styleUrls: ['edit-dynamic-properties.component.scss'],
    moduleId: module.id
})
export class EditDynamicPropertiesComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;


    constructor() {
        super();

    }


}
