import {Component, Input} from "@angular/core";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.html',
    moduleId: module.id
})
export class DiagramComponent {

    @Input("coordSetId")
    coordSetId: number | null = null;

    constructor() {

    }

}
