import {Component, Input} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-edit-props-livedb',
    templateUrl: 'edit-props-livedb.component.html',
    styleUrls: ['edit-props-livedb.component.scss'],
    moduleId: module.id
})
export class EditPropsLivedbComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;


    constructor() {
        super();

    }


}
