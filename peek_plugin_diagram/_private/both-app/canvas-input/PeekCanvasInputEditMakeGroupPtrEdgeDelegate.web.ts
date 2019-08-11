import {EditorToolType} from "../canvas/PeekCanvasEditorToolType.web";
import {
    CanvasInputPos,
    InputDelegateConstructorViewArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {DispGroupPointer} from "../canvas-shapes/DispGroupPointer";
import {PointI} from "../canvas-shapes/DispBase";
import {DrawModeE} from "../canvas-render/PeekDispRenderDelegateABC.web";
import {InputDelegateConstructorEditArgs} from "./PeekCanvasInputDelegateUtil.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputMakeDispGroupPtrEdgeDelegate
    extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_EDGE;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;


    constructor(viewArgs: InputDelegateConstructorViewArgs,
                editArgs: InputDelegateConstructorEditArgs) {
        super(viewArgs, editArgs,
            PeekCanvasInputMakeDispGroupPtrEdgeDelegate.TOOL_NAME);

        this._reset();
    }

    _reset() {
        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;

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

        this.createDisp(mouse.x, mouse.y);
    }

    touchStart(event: TouchEvent, mouse: CanvasInputPos) {
        this._finaliseCreate();
        this._startMousePos = mouse;
    };

    touchEnd(event: TouchEvent, mouse: CanvasInputPos) {
        if (this._hasPassedDragThreshold(this._startMousePos, mouse)) {
            this._reset();
            return;
        }

        this.createDisp(mouse.x, mouse.y);
    };


    private createDisp(x: number, y: number) {

        // Create the Disp
        let created = DispGroupPointer.create(this.viewArgs.config.coordSet);
        DispGroupPointer.setCenterPoint(created, x, y);

        this.editArgs.lookupService._linkDispLookups(created);

        // Add the shape to the branch
        created = this.editArgs.branchContext.branchTuple.addOrUpdateDisp(created, true);

        // TODO, Snap the coordinates if required
        // if (this.viewArgs.config.editor.snapToGrid)
        //     DispText.snap(created, this.viewArgs.config.editor.snapSize);

        // Let the canvas editor know something has happened.
        // this.editArgs.dispPropsUpdated();

        this.viewArgs.model.recompileModel();

        this.viewArgs.model.selection.replaceSelection(<any> created);
        this.editArgs.editToolbarProps.showGroupPtrProperties();

        this._addBranchAnchor(x, y);
        this.editArgs.setEditorSelectTool();
    }


    delegateWillBeTornDown() {
        this._finaliseCreate();
    }

    draw(ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
    }

    _finaliseCreate() {
        this._reset();
        this.editArgs.branchContext.branchTuple.touchUpdateDate(true);
        this.editArgs.branchContext.branchTuple.touchUndo();
        this.viewArgs.config.invalidate();
    }


}