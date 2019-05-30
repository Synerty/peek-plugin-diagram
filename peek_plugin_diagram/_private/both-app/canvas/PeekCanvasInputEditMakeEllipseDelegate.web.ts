import {
    CanvasInputPos,
    InputDelegateConstructorArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {DispEllipse} from "../tuples/shapes/DispEllipse";
import {PointI} from "../tuples/shapes/DispBase";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeEllipseDelegate
    extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_CIRCLE_ELLIPSE_ARC;


    // Stores the text disp being created
    private _creating = null;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;


    private _dragThresholdPassed = false;


    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor, PeekCanvasInputEditMakeEllipseDelegate.TOOL_NAME);

        // Stores the rectangle being created
        this._creating = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;

        this._reset();
    }

    _reset() {
        this._creating = null;
        this._startMousePos = null;
        this._dragThresholdPassed = false;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = new CanvasInputPos();

    }


    // ============================================================================
    // Editor Ui Mouse


    // ---------------
    // Map mouse events
    mouseDown(event: MouseEvent, inputPos: CanvasInputPos) {
        this.inputStart(inputPos);
    }


    mouseMove(event: MouseEvent, inputPos: CanvasInputPos) {
        this.inputMove(inputPos);
    }

    mouseUp(event: MouseEvent, inputPos: CanvasInputPos) {
        this.inputEnd(inputPos);
    }


    // ---------------
    // Map touch events
    touchStart(event: TouchEvent, inputPos: CanvasInputPos) {
        this.inputStart(inputPos);
    };

    touchMove(event: TouchEvent, inputPos: CanvasInputPos) {
        this.inputMove(inputPos);
    };

    touchEnd(event: TouchEvent, inputPos: CanvasInputPos) {
        this.inputEnd(inputPos);
    };


    // ---------------
    // Misc delegate methods
    delegateWillBeTornDown() {
        this._finaliseCreate();
    }

    draw(ctx, zoom: number, pan: PointI, forEdit: boolean) {
    }


    // ---------------
    // Start logic
    private inputStart(inputPos: CanvasInputPos) {
        this._startMousePos = inputPos;
    }

    private inputMove(inputPos: CanvasInputPos) {
        if (this._startMousePos == null)
            return;

        if (!this._creating) {
            if (!this._hasPassedDragThreshold(this._startMousePos, inputPos))
                return;

            this.createDisp(inputPos);
        }

        // if (editorUi.grid.snapping())
        //     this._creating.snap(editorUi.grid.snapSize());
        this.updateSize(inputPos);
    }


    private inputEnd(inputPos: CanvasInputPos) {
        if (!this._creating) {
            return;
        }

        this.updateSize(inputPos);
        this._finaliseCreate();

        this._reset();
    }

    private updateSize(inputPos: CanvasInputPos) {

        if (!this._creating)
            return;

        let startMouse: PointI = {x: this._startMousePos.x, y: this._startMousePos.y};
        let point: PointI = {x: inputPos.x, y: inputPos.y};
        // if (editorUi.grid.snapping()) {
        //     var snapSize = editorUi.grid.snapSize();
        //     point.snap(snapSize);
        //     startMouse.snap(snapSize);
        // }


        let x = point.x < startMouse.x ? point.x : startMouse.x;
        let y = point.y < startMouse.y ? point.y : startMouse.y;

        let xRadius = Math.abs(point.x - startMouse.x);
        let yRadius = Math.abs(point.y - startMouse.y);

        DispEllipse.setCenter(this._creating, {x, y});
        DispEllipse.setXRadius(this._creating, xRadius );
        DispEllipse.setYRadius(this._creating, yRadius);
        this.viewArgs.config.invalidate();
    }

    private createDisp(inputPos: CanvasInputPos) {

        this._creating = DispEllipse.create(this.viewArgs.config.coordSet);

        // Link the Disp
        this.canvasEditor.lookupService._linkDispLookups(this._creating);

        // Add the shape to the branch
        this._creating = this.canvasEditor.branchContext.branchTuple
            .addOrUpdateDisp(this._creating);

        // TODO, Snap the coordinates if required
        // if (this.viewArgs.config.editor.snapToGrid)
        //     DispText.snap(this._creating, this.viewArgs.config.editor.snapSize);

        // Let the canvas editor know something has happened.
        // this.canvasEditor.dispPropsUpdated();

        this.viewArgs.model.compileBranchDisps();

        this.viewArgs.model.selection.replaceSelection(this._creating);
        this.canvasEditor.props.showShapeProperties();

        this._addBranchAnchor(inputPos.x, inputPos.y);
    }

    private _finaliseCreate() {
        if (this._creating == null)
            return;

        this.viewArgs.config.invalidate();
        this.canvasEditor.setEditorSelectTool();
    }
}