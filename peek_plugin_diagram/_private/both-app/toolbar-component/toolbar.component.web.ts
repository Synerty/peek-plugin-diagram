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
    templateUrl: 'toolbar.component.web.html',
    styleUrls: ['toolbar.component.web.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ToolbarComponentBase {

    toolbarIsOpen:boolean = false;

    constructor(abstractToolbarService: DiagramToolbarService,
                 navBackService: NavBackService) {
        super(abstractToolbarService, navBackService);

    }

    buttonClicked(btn:DiagramToolButtonI) :void {
        if (btn.callback != null) {
            btn.callback();
        } else {
            // TODO Expand toolbar children
        }

    }

    openToolbar() :void{
        this.toolbarIsOpen = true;
    }

    closeToolbar():void{
        this.toolbarIsOpen = false;
    }


}
