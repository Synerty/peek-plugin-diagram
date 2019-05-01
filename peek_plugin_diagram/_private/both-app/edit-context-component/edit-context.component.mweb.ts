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
import {EditContextComponentBase} from "./edit-context.component";


@Component({
    selector: 'pl-diagram-edit-context',
    templateUrl: 'edit-context.component.mweb.html',
    styleUrls: ['edit-context.component.mweb.scss'],
    moduleId: module.id
})
export class EditContextComponent extends EditContextComponentBase {
    @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';

    constructor() {
        super();

    }

    platformOpen(): void {
        // .modal is defined in bootstraps code
        let jqModal: any = $(this.modalView.nativeElement);

        jqModal.modal({
            backdrop: 'static',
            keyboard: false
        });

        // Move the backdrop
        let element = $(this.backdropId).detach();
        jqModal.parent().append(element);
    }

    platformClose(): void {
        let jqModal: any = $(this.modalView.nativeElement);
        jqModal.modal('hide');
    }


}
