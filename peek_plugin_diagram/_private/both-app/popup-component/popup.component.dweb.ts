import {Component, Input, OnInit, ViewChild} from "@angular/core";

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
import {PopupComponentBase} from "./popup.component";


@Component({
    selector: 'pl-diagram-popup',
    templateUrl: 'popup.component.dweb.html',
    styleUrls: ['popup.component.dweb.scss'],
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {
  // @ViewChild('canvas') canvasView;

    private modalId = '#diagramPopupModal';

    constructor(  titleService: TitleService,
                itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super(titleService, itemSelectService, abstractItemPopupService);

    }

    closeClicked():void{
        this.closePopup();
    }

    platformOpen() :void{
        // .modal is defined in bootstraps code
        let jqModal:any = $(modalId);

        jqModal.modal({});

        // Move the backdrop
        let element = $('div.modal-backdrop').detach();
        $('#diagramPopupModal').parent().append(element);
    }

    platformClose():void {
        //pass
    }


}
