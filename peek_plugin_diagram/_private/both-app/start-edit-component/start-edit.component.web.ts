import {Component, ViewChild} from "@angular/core";
import {EditContextComponentBase} from "./edit-context.component";


@Component({
    selector: 'pl-diagram-start-edit',
    templateUrl: 'start-edit.component.web.html',
    styleUrls: ['start-edit.component.web.scss'],
    moduleId: module.id
})
export class StartEditComponent extends EditContextComponentBase {
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
