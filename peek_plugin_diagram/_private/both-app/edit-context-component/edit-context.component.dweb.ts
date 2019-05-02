import {Component} from "@angular/core";
import {EditContextComponentBase} from "./edit-context.component";


@Component({
    selector: 'pl-diagram-edit-context',
    templateUrl: 'edit-context.component.dweb.html',
    styleUrls: ['edit-context.component.dweb.scss'],
    moduleId: module.id
})
export class EditContextComponent extends EditContextComponentBase {



    constructor() {
        super();

    }

    platformOpen(): void {
    }

    platformClose(): void {
    }


}
