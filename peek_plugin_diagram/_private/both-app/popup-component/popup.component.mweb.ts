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
    templateUrl: 'popup.component.mweb.html',
    styleUrls: ['popup.component.mweb.scss'],
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {
   @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';

    constructor(  titleService: TitleService,
                itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super(titleService, itemSelectService, abstractItemPopupService);

    }

    platformOpen() :void{
        // .modal is defined in bootstraps code
        let jqModal:any = $(this.modalView.nativeElement);

        jqModal.modal({backdrop:'static',
        keyboard:false});

        // Move the backdrop
        let element = $(this.backdropId).detach();
        jqModal.parent().append(element);
    }

    platformClose():void {
        let jqModal:any = $(this.modalView.nativeElement);
        jqModal.modal('hide');
    }


}
