import {Component} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {ToolbarComponentBase} from "./toolbar.component";


import {
    DiagramBranchService
} from "@peek/peek_plugin_diagram/DiagramBranchService";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.web.html',
    styleUrls: ['toolbar.component.web.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ToolbarComponentBase {

    constructor(abstractToolbarService: DiagramToolbarService,
                branchService: DiagramBranchService) {
        super(abstractToolbarService, branchService);

    }


}
