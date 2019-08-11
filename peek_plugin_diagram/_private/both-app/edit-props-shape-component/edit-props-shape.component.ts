import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../canvas/PeekCanvasShapePropsContext";
import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {DispBase} from "../canvas-shapes/DispBase";


@Component({
    selector: 'pl-diagram-edit-props-shape',
    templateUrl: 'edit-props-shape.component.html',
    styleUrls: ['edit-props-shape.component.scss'],
    moduleId: module.id
})
export class EditPropsShapeComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    context: PeekCanvasShapePropsContext = new PeekCanvasShapePropsContext();

    constructor() {
        super();

    }

    ngOnInit() {
        this.context = this.canvasEditor.props.shapePanelContext;
        this.canvasEditor.props.shapePanelContextObservable
            .takeUntil(this.onDestroyEvent)
            .subscribe((context: PeekCanvasShapePropsContext) => {
                this.context = context;
                this.processContext(context);
            });
        this.processContext(this.context);
    }

    private prepForWrite() {
        let oldDispId = DispBase.id(this.context.disp);
        // Ensure the shape is in the branch before updating it.
        this.context.disp = this.canvasEditor
            .branchContext.branchTuple.addOrUpdateDisp(this.context.disp, true);

        if (DispBase.id(this.context.disp) != oldDispId) {
            this.canvasEditor.canvasModel.recompileModel();
            this.canvasEditor.canvasModel.selection.replaceSelection(this.context.disp);
        }
    }

    readVal(prop: ShapeProp): any {
        return prop.getter(this.context.disp);
    }

    writeVal(prop: ShapeProp, val: any, touchUndo: boolean = true): void {
        this.prepForWrite();
        prop.setter(this.context.disp, val);
        this.canvasEditor.dispPropsUpdated(touchUndo);
    }

    propLostFocus(): void {
        this.canvasEditor.dispPropsUpdated(true);
    }

    readOptionVal(prop: ShapeProp): any {
        let obj = prop.getter(this.context.disp);
        if (obj == null) {
            return 'null';
        }
        if (obj.id == null)
            throw new Error(`Prop ${prop.name} getter result doesn't have an ID`);
        return obj.id.toString();
    }

    writeOptionVal(prop: ShapeProp, value: string): void {
        this.prepForWrite();

        prop.__lastShowValue = null;
        let obj = value == 'null' ? null : prop.getOptionObject(value);
        prop.setter(this.context.disp, obj);
        this.canvasEditor.dispPropsUpdated();
    }

    showInput(prop: ShapeProp) {
        return prop.type == ShapePropType.String;
    }

    showTextArea(prop: ShapeProp) {
        return prop.type == ShapePropType.MultilineString;
    }

    showBoolean(prop: ShapeProp) {
        return prop.type == ShapePropType.Boolean;
    }

    showInteger(prop: ShapeProp) {
        return prop.type == ShapePropType.Integer;
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
        if (context == null) {
            return;
        }

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
                    prop.allowNullOption = true;
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

    showLayerNotVisible(prop: ShapeProp): boolean {
        if (prop.type != ShapePropType.Layer)
            return false;

        // Optimise the change detection
        if (prop.__lastShowValue != null)
            return prop.__lastShowValue;

        let layer: DispLayer = prop.getter(this.context.disp);
        prop.__lastShowValue = !layer.visible;
        return prop.__lastShowValue;
    }

    showLevelNotVisible(prop: ShapeProp): boolean {
        if (prop.type != ShapePropType.Level)
            return false;

        // Optimise the change detection
        if (prop.__lastShowValue != null)
            return prop.__lastShowValue;

        let level: DispLevel = prop.getter(this.context.disp);
        prop.__lastShowValue = !this.canvasEditor.isLevelVisible(level);
        return prop.__lastShowValue;
    }

}
