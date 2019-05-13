import {
    CanvasInputPos,
    InputDelegateConstructorArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {DispText} from "../tuples/shapes/DispText";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {pointToPixel} from "../DiagramUtil";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {PeekCanvasShapePropsContext} from "./PeekCanvasShapePropsContext";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeTextDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_TEXT;

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

        let inp = String.fromCharCode(event.keyCode);
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


        // Setup the shape edit context
        let shapePropsContext = new PeekCanvasShapePropsContext(
            this._creating, this.canvasEditor.lookupService,
            this.canvasEditor.modelSetId,
            this.canvasEditor.coordSetId
        );

        DispText.makeShapeContext(shapePropsContext);
        this.canvasEditor.setShapePropertiesContext(shapePropsContext);

        // Add the shape to the branch
        this._creating = this.canvasEditor.branchContext.addOrUpdateDisp(this._creating);
        this.viewArgs.config.setModelNeedsCompiling();

        // TODO, Snap the coordinates if required
        // if (this.viewArgs.config.editor.snapToGrid)
        //     DispText.snap(this._creating, this.viewArgs.config.editor.snapSize);

        // Let the canvas editor know something has happened.
        // this.canvasEditor.dispPropsUpdated();
    }

    delegateWillBeTornDown() {
        this._finaliseCreate();
    }

    draw(ctx, zoom, pan) {
        /*
        if (this._creating == null)
            return;

        //this.viewArgs.renderFactory.draw(this._creating, ctx, zoom, pan);

        // Give meaning to our short names
        let rotationRadian = 0;

        // TODO, Draw a box around the text, based on line style

        let fontSize = 14;

        let font = "14px Roboto ";

        let lineHeight = pointToPixel(fontSize);

        let textAlign = 'center';
        let textBaseline = 'middle';

        // save state
        ctx.save();
        ctx.translate(DispText.centerPointX(this._creating),
            DispText.centerPointY(this._creating));
        ctx.rotate(rotationRadian); // Degrees to radians

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.font = font;

        let unscale = 1.0 / zoom;
        ctx.scale(unscale, unscale);


        let lines = DispText.text(this._creating).split("\n");
        for (let lineIndex = 0; lineIndex < lines.length; ++lineIndex) {
            let line = lines[lineIndex];
            let yOffset = lineHeight * lineIndex;

            ctx.fillStyle = 'green';
            ctx.fillText(line, 0, yOffset);
        }
        ctx.restore();
        */
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