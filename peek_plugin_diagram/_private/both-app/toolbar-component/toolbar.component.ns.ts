import {Component, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {ToolbarComponentBase} from "./toolbar.component";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.ns.html',
    styleUrls: ['toolbar.component.ns.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ToolbarComponentBase {

    constructor(abstractToolbarService: DiagramToolbarService,
                 navBackService: NavBackService) {
        super(abstractToolbarService, navBackService);

    }


    openToolbar() :void{
    }

    closeToolbar():void{
    }


}
