import {Component, ViewChild} from "@angular/core";
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
