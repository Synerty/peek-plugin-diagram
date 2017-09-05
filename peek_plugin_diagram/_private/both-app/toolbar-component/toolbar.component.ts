import {Component, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramToolbarPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.web.html',
    moduleId: module.id
})
export class ToolbarComponent extends ComponentLifecycleEventEmitter
    implements OnInit {


    private toolbarService: DiagramToolbarPrivateService;


    constructor(abstractToolbarService: DiagramToolbarService) {
        super();

        this.toolbarService = <DiagramToolbarPrivateService> abstractToolbarService;

    }

    ngOnInit() {


    }


}
