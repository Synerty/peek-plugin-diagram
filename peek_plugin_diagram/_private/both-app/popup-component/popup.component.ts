import {Component, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramItemPopupPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";


@Component({
    selector: 'pl-diagram-popup',
    templateUrl: 'popup.component.web.html',
    moduleId: module.id
})
export class PopupComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    private itemPopupService: DiagramItemPopupPrivateService;

    constructor(private itemSelectService: DiagramItemSelectPrivateService,
                abstractItemPopupService: DiagramItemPopupService) {
        super();

        this.itemPopupService = <DiagramItemPopupPrivateService> abstractItemPopupService;


    }

    ngOnInit() {


    }


}
