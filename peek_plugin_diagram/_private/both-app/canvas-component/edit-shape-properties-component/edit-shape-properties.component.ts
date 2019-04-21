import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";
import {PeekCanvasShapePropsContext, ShapeProp} from "../../canvas/shape-props/PeekCanvasShapePropsContext";


@Component({
    selector: 'pl-diagram-edit-shape-properties',
    templateUrl: 'edit-shape-properties.component.html',
    styleUrls: ['edit-shape-properties.component.scss'],
    moduleId: module.id
})
export class EditShapePropertiesComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    context: PeekCanvasShapePropsContext = new PeekCanvasShapePropsContext();


    constructor() {
        super();

    }

    ngOnInit() {
        this.context = this.canvasEditor.shapePanelContext();
        this.canvasEditor.shapePanelContextObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((context: PeekCanvasShapePropsContext) => this.context = context);
    }

    readVal(prop: ShapeProp): any {
        return prop.getter(this.context.disp);
    }

    writeVal(prop: ShapeProp, val: any): void {
        prop.setter(this.context.disp, val);
        this.canvasEditor.dispPropsUpdated();
    }


}
