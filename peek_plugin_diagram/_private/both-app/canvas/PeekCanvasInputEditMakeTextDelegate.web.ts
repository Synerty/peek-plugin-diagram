import {
    CanvasInputPos,
    InputDelegateConstructorArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {DispText} from "../tuples/shapes/DispText";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {DispGroup} from "../tuples/shapes/DispGroup";
import {PointI} from "../tuples/shapes/DispBase";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeTextDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_TEXT;

    // Stores the text disp being created
    private _creating = null;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;

    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor, PeekCanvasInputEditMakeTextDelegate.TOOL_NAME);

        // Stores the rectangle being created
        this._creating = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;

        this._reset();
    }

    _reset() {
        this._creating = null;
        this._startMousePos = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = new CanvasInputPos();

    }


    // ============================================================================
    // Editor Ui Mouse


    keyPress(event) {
        if (!this._creating)
            return;

        let enteredText = DispText.text(this._creating);

        if (event.keyCode == 8) { // Backspace
            if (enteredText && enteredText.length)
                enteredText = enteredText.substr(0,
                    enteredText.length - 1);
            else
                enteredText = '';
            this._creating.setText(enteredText);
            this.viewArgs.config.invalidate();
            return;
        }

        if (event.keyCode == 13) { // Enter
            this._finaliseCreate();
        }

        let inp = String.fromCharCode(event.keyCode);
        if (/[a-zA-Z0-9-_ .,`"'|~!@#$%^&*()-=+{}\[\]\\:;<>\/?]/.test(inp)) {
            enteredText = (enteredText || '') + inp;
            this._creating.setText(enteredText);
            this.viewArgs.config.invalidate();
            return;
        }
    }

    keyUp(event) {
        if (!this._creating)
            return;

        if (event.keyCode == 46 // delete
            || event.keyCode == 27) { // escape
            this._reset();
            return;
        }
    }

    mouseDown(event, mouse) {
        this._finaliseCreate();
        this._startMousePos = mouse;
    }

    mouseUp(event, mouse) {
        if (this._hasPassedDragThreshold(this._startMousePos, mouse)) {
            this._reset();
            return;
        }

        this.createDisp(mouse.x, mouse.y);
    }

    touchStart(event: TouchEvent, mouse: CanvasInputPos) {
        this.mouseDown(event, mouse);
    };

    touchEnd(event: TouchEvent, mouse: CanvasInputPos) {
        this.mouseUp(event, mouse);
    };


    private createDisp(x: number, y: number) {
        // Create the Disp
        this._creating = DispText.create(this.viewArgs.config.coordSet);
        DispText.setCenterPoint(this._creating, x, y);
        this.canvasEditor.lookupService._linkDispLookups(this._creating);

        // Add the shape to the branch
        this._creating = this.canvasEditor.branchContext.branchTuple
            .addOrUpdateDisp(this._creating, true);

        this.viewArgs.model.recompileModel();

        this.viewArgs.model.selection.replaceSelection(this._creating);

        this._addBranchAnchor(x, y);
        this.canvasEditor.setEditorSelectTool();
    }

    delegateWillBeTornDown() {
        this._finaliseCreate();
    }

    draw(ctx, zoom: number, pan: PointI, forEdit: boolean) {
    }

    _finaliseCreate() {
        this.canvasEditor.props.showShapeProperties();
        this._reset();
        this.viewArgs.config.invalidate();
    }

}