import {Component, Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {PopupComponentBase} from "./popup.component";


@Component({
    selector: 'pl-diagram-popup',
    templateUrl: 'popup.component.mweb.html',
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {


    constructor( itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super(itemSelectService, abstractItemPopupService);

    }

    closeClicked():void{
        this.closePopup();
    }

    platformOpen() :void{
        // .modal is defined in bootstraps code
        $('#diagramPopupModal')["modal"]({})
    }

    platformClose():void {
        //pass
    }


}
