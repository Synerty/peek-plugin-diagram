import {Component} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {ToolbarComponentBase} from "./toolbar.component";
import {GridLoaderA} from "../cache/GridLoader";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.web.html',
    styleUrls: ['toolbar.component.web.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ToolbarComponentBase {

    constructor(abstractToolbarService: DiagramToolbarService,
                navBackService: NavBackService,
                HACK_gridLoader: GridLoaderA) {
        super(abstractToolbarService, navBackService, HACK_gridLoader);

    }


}
