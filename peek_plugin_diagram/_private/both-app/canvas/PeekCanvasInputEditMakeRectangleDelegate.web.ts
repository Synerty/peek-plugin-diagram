import {CanvasInputPos, InputDelegateConstructorArgs, PeekCanvasInputDelegate} from "./PeekCanvasInputDelegate.web";
import {DispText} from "../tuples/shapes/DispText";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeRectangleDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_RECTANGLE;

    // // CONSTANTS
    // STATE_NONE = 0;
    // STATE_SELECTING = 1;
    // STATE_DRAG_SELECTING = 2;
    // STATE_MOVING_RENDERABLE = 3;
    // STATE_MOVING_HANDLE = 4;
    // STATE_CANVAS_PANNING = 5;
    // STATE_CANVAS_ZOOMING = 6;

    // _state = 0; // STATE_NONE;
    // _passedDragThreshold = false;
    // _mouseDownOnSelection = false;
    // _mouseDownOnDisp = false;
    // _mouseDownWithShift = false;
    // _mouseDownWithCtrl = false;
    // _mouseDownMiddleButton = false;
    // _mouseDownRightButton = false;
    // _mouseDownOnHandle = null;

    // _lastPinchDist = null;


    // Stores the text disp being created
    private _creating = null;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;
    private _startNodeRend = null;
    private _endNodeRend = null;

    private _enteredText: string = '';

    //canvasInput._scope.pageData.modelRenderables;

    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor, PeekCanvasInputEditMakeRectangleDelegate.TOOL_NAME);

        // Stores the rectangle being created
        this._creating = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;

        this._reset();
    }

    _reset() {
        this._creating = null;
        this._startMousePos = null;
        this._startNodeRend = null;
        this._endNodeRend = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;

        this._enteredText = '';
    }


    // ============================================================================
    // Editor Ui Mouse

    // fixes a problem where double clicking causes
    // text to get selected on the canvas
    // mouseSelectStart =
    // function(event,
    // mouse) {
    // };

    keyPress(event) {
        if (!this._creating)
            return;

        if (event.keyCode == 8) { // Backspace
            if (this._enteredText && this._enteredText.length)
                this._enteredText = this._enteredText.substr(0,
                    this._enteredText.length - 1);
            else
                this._enteredText = '';
            this._creating.setText(this._enteredText);
            this.viewArgs.config.invalidate();
            return;
        }

        if (event.keyCode == 13) { // Enter
            this._finaliseCreate();
        }

        var inp = String.fromCharCode(event.keyCode);
        if (/[a-zA-Z0-9-_ .,`"'|~!@#$%^&*()-=+{}\[\]\\:;<>\/?]/.test(inp)) {
            this._enteredText = (this._enteredText || '') + inp;
            this._creating.setText(this._enteredText);
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

        this._creating = DispText.create();
        DispText.setCenterPoint(this._creating, mouse.x, mouse.y);

        // if (editorUi.grid.snapping())
        //     this._creating.snap(editorUi.grid.snapSize());

        this.viewArgs.config.invalidate();
    }

    delegateWillBeTornDown() {
        this._finaliseCreate();
    }

    draw(ctx, zoom, pan) {
        if (this._creating != null)
            this.viewArgs.renderFactory.draw(this._creating, ctx, zoom, pan);
    }

    _finaliseCreate() {
        // DiagramBranchContext

        // TODO, Add to branch context
        // if (this._enteredText && this._creating)
        //     this._creating.storeState();

        this._reset();
        this.viewArgs.config.invalidate();
    }

}