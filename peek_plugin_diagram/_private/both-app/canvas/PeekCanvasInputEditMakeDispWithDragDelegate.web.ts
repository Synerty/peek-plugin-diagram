import {MousePos, PeekCanvasInputDelegate} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputMakeDispWithDragDelegateWeb extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME: "MAKE_DISP_WITH_DRAG";

    // CONSTANTS
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
    // _mouseDownOnCoord = false;
    // _mouseDownWithShift = false;
    // _mouseDownWithCtrl = false;
    // _mouseDownMiddleButton = false;
    // _mouseDownRightButton = false;
    // _mouseDownOnHandle = null;

    // _lastPinchDist = null;

    // See mousedown and mousemove events for explanation
    private _startMousePos: MousePos | null = null;


    private _creating = null;

    private _dragThresholdPassed = false;

    constructor(private canvasInput: PeekCanvasInput,
                private config: PeekCanvasConfig,
                private model: PeekCanvasModel,
                private dispDelegate: PeekDispRenderFactory) {
        super(PeekCanvasInputMakeDispWithDragDelegateWeb.TOOL_NAME);

        this._reset();
    }

    private _reset() {
        this._creating = null;
        this._dragThresholdPassed = false;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;
    };

    //
    // /**
    //  * Create Renderable Creates a new instance of the object this delegate is
    //  * supposed to create
    //  */
    // private _createRenderable(bounds: PeekCanvasBounds) {
    //     alert("Not implemented");
    // }
    //
    // // fixes a problem where double clicking causes
    // // text to get selected on the canvas
    // // mouseSelectStart =
    // // function(event,
    // // mouse) {
    // // };
    //
    // mouseDown(event, mouse) {
    //     this._startMousePos = mouse;
    // }
    //
    // mouseMove(event, mouse) {
    //     if (!this._startMousePos)
    //         return;
    //
    //     if (!this._creating) {
    //         if (!this._hasPassedDragThreshold(this._startMousePos, mouse))
    //             return;
    //
    //         let b = PeekCanvasBounds.fromPoints(this._startMousePos, mouse);
    //         this._creating = this._createRenderable(b);
    //         this._creating.setPage(editorPage.currentPageId());
    //         this._creating.setLayer(this.newObjectLayer());
    //         if (editorUi.grid.snapping())
    //             this._creating.snap(editorUi.grid.snapSize());
    //         return;
    //     }
    //
    //     this._applySize(mouse);
    // }
    //
    // mouseUp(event, mouse) {
    //     if (!this._creating) {
    //         this._canvasMouse.delegateFinished();
    //         return;
    //     }
    //
    //     this._applySize(mouse);
    //     this._creating.storeState();
    //
    //     this._reset();
    // }
    //
    // mouseDoubleClick(
    //     event, mouse) {
    // }
    //
    // private _applySize(mouse) {
    //     if (!this._creating)
    //         return;
    //
    //     let startMouse = new Coord(this._startMousePos.x, this._startMousePos.y);
    //     let mouse = new Coord(mouse.x, mouse.y);
    //     if (editorUi.grid.snapping()) {
    //         let snapSize = editorUi.grid.snapSize();
    //         mouse.snap(snapSize);
    //         startMouse.snap(snapSize);
    //     }
    //
    //     let x = startMouse.x;
    //     if (mouse.x < x)
    //         x = mouse.x;
    //
    //     let y = startMouse.y;
    //     if (mouse.y < y)
    //         y = mouse.y;
    //
    //     let w = Math.abs(mouse.x - startMouse.x);
    //     let h = Math.abs(mouse.y - startMouse.y);
    //
    //     this._creating.move(x, y);
    //     this._creating.resize(w, h);
    //     editorRenderer.invalidate();
    // }
    //
    // draw(ctx) {
    //     if (this._creating)
    //         this._creating.draw(ctx);
    // }


}
