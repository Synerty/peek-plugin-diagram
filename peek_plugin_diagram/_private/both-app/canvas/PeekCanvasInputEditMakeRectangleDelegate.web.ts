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




    mouseDown(event, mouse) {
        this._finaliseCreate();
        this._startMousePos = mouse;
    }

    mouseUp(event, mouse) {
        if (this._hasPassedDragThreshold(this._startMousePos, mouse)) {
            this._reset();
            return;
        }


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