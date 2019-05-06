import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../canvas/PeekCanvasShapePropsContext";


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
            .subscribe((context: PeekCanvasShapePropsContext) => {
                this.context = context;
                this.processContext(context);
            });
        this.processContext(this.context);
    }

    readVal(prop: ShapeProp): any {
        return prop.getter(this.context.disp);
    }

    writeVal(prop: ShapeProp, val: any): void {
        prop.setter(this.context.disp, val);
        this.canvasEditor.dispPropsUpdated();
    }

    readOptionVal(prop: ShapeProp): any {
        let obj = prop.getter(this.context.disp);
        if (obj.id == null)
            throw new Error(`Prop ${prop.name} getter result doesn't have an ID`);
        return obj.id;
    }

    writeOptionVal(prop: ShapeProp, value: string): void {
        let obj = prop.getOptionObject(value);
        prop.setter(this.context.disp, obj);
        this.canvasEditor.dispPropsUpdated();
    }

    showInput(prop: ShapeProp) {
        return prop.type == ShapePropType.String;
    }

    showBoolean(prop: ShapeProp) {
        return prop.type == ShapePropType.Boolean;
    }

    showSelectOption(prop: ShapeProp) {
        return prop.type == ShapePropType.Layer
            || prop.type == ShapePropType.Level
            || prop.type == ShapePropType.TextStyle
            || prop.type == ShapePropType.Color
            || prop.type == ShapePropType.LineStyle
            || prop.type == ShapePropType.Option;
    }


    private processContext(context: PeekCanvasShapePropsContext): void {
        for (let prop of context.props()) {
            switch (prop.type) {
                case ShapePropType.Layer:
                    prop.options = this.context.layerOptions;
                    break;

                case ShapePropType.Level:
                    prop.options = this.context.levelOptions;
                    break;

                case ShapePropType.TextStyle:
                    prop.options = this.context.textStyleOptions;
                    break;

                case ShapePropType.Color:
                    prop.options = this.context.colorOptions;
                    break;

                case ShapePropType.LineStyle:
                    prop.options = this.context.lineStyleOptions;
                    break;

                default:
                    break;

            }
        }

    }

}
