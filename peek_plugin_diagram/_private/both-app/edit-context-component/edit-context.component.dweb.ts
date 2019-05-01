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
import {PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";
import {EditContextComponentBase} from "./edit-context.component";


@Component({
    selector: 'pl-diagram-edit-context',
    templateUrl: 'edit-context.component.dweb.html',
    styleUrls: ['edit-context.component.dweb.scss'],
    moduleId: module.id
})
export class EditContextComponent extends EditContextComponentBase {



    constructor() {
        super();

    }

    platformOpen(): void {
    }

    platformClose(): void {
    }


}
