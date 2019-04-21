import {
    CanvasInputPos,
    PeekCanvasInputDelegate, PeekCanvasInputDelegateConstructorArgs
} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeDispPolyDelegate extends PeekCanvasInputDelegate {

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


    // Stores the rectangle being created
    private _creating = null;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;
    private _startNodeRend = null;
    private _endNodeRend = null;

    private _nodes = []; //canvasInput._scope.pageData.modelRenderables;

    constructor(cargs: PeekCanvasInputDelegateConstructorArgs,
                tool: EditorToolType) {
        super(cargs, tool);

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
    }

    //
    //  keyUp(event) {
    //     if (!this._creating)
    //         return;
    //
    //     // Cancel creating object
    //     if (event.keyCode == 46 // delete
    //         || event.keyCode == 27) { // escape
    //         this._reset();
    //         return;
    //     }
    //
    //     if (event.keyCode == 8) { // Backspace
    //         // We want to keep at least two points at all times
    //         if (this._creating.pointCount() < 3)
    //             return;
    //         // Remove last point
    //         this._creating.popPoint();
    //         editorRenderer.invalidate();
    //         return;
    //     }
    //
    //     if (event.keyCode == 13) { // Enter
    //         this._finaliseCreate();
    //         return;
    //     }
    // }
    //
    //
    // private _nodeRendClickedOn(mouse) {
    //
    //
    //     for (let i = this._nodes.length - 1; 0 <= i; i--) {
    //         let rend = this._nodes[i];
    //         if (rend.contains(mouse.x, mouse.y)) {
    //             return rend;
    //             break;
    //         }
    //     }
    //
    //     return null;
    // }
    //
    //
    //  mouseDown(event, mouse) {
    //
    //
    //     if (this._startNodeRend) {
    //         this._startMousePos = mouse;
    //         return;
    //     }
    //
    //     this._startNodeRend = this._nodeRendClickedOn(mouse);
    //
    //     if (!this._startNodeRend) {
    //         logWarning("A conductor must start on a node");
    //         this._reset();
    //         this.canvasInput._scope.pageMethods.cableCreateCallback();
    //         return;
    //     }
    //
    //     this._startMousePos = mouse;
    // }
    //
    //
    //  mouseMove(event, mouse) {
    //     if (!this._creating)
    //         return;
    //
    //
    //     let disp = this._coord(event, mouse);
    //     this._creating.movePoint(this._creating.pointCount() - 1, disp.x, disp.y);
    //     editorRenderer.invalidate();
    // }
    //
    //  mouseUp(event, mouse) {
    //
    //
    //     if (!this._startMousePos)
    //         return;
    //
    //     let dragged = this._hasPassedDragThreshold(this._startMousePos, mouse);
    //     let disp = this._coord(event, this._startMousePos);
    //     this._startMousePos = null;
    //
    //     if (dragged)
    //         return;
    //
    //     if (event.button == 2) {
    //         this._finaliseCreate();
    //         return;
    //     }
    //
    //     if (!this._creating) {
    //         this._creating = new PolyRenderable(disp.x, disp.y);
    //         //this._creating.setPage(editorPage.currentPageId());
    //         //this._creating.setLayer(this.newObjectLayer());
    //     }
    //
    //     this._creating.addPoint(disp.x, disp.y);
    //
    //     editorRenderer.invalidate();
    // }
    //
    // mouseDoubleClick(event, mouse) {
    //    this._creating.setClosed(true);
    //    this._finaliseCreate();
    // }
    //
    //  delegateWillBeTornDown() {
    //     //this._finaliseCreate();
    // }
    //
    //  draw(ctx, zoom, pan) {
    //     if (this._creating)
    //         this._creating.draw(ctx);
    // }
    //
    // private _finaliseCreate() {
    //
    //     let poly = this._creating;
    //     let startNodeRend = this._startNodeRend;
    //     let endNodeRend = null;
    //
    //     this._reset();
    //
    //     if (poly) {
    //         let lastPointCoord = poly.lastPoint().disp(poly);
    //         endNodeRend = this._nodeRendClickedOn(lastPointCoord);
    //     }
    //
    //     if (!endNodeRend) {
    //         logWarning("A conductor must end on a node");
    //         poly = null;
    //     }
    //
    //     this.canvasInput._scope.pageMethods.cableCreateCallback(poly, startNodeRend, endNodeRend);
    //
    //     editorRenderer.invalidate();
    // }
    //
    // private _coord(event, mouse) {
    //     let disp = new Coord(mouse.x, mouse.y);
    //
    //     //// Snap if required
    //     //if (editorUi.grid.snapping())
    //     //    disp.snap(editorUi.grid.snapSize());
    //
    //     // When the shift key is pressed, we will align to x or y axis
    //     if (this._creating && event.shiftKey) {
    //         let lastCoord = this._creating
    //             .pointCoord(this._creating.pointCount() - 2);
    //         let dx = Math.abs(disp.x - lastCoord.x);
    //         let dy = Math.abs(disp.y - lastCoord.y);
    //
    //         if (dx > dy)
    //             disp.y = lastCoord.y;
    //         else
    //             disp.x = lastCoord.x;
    //     }
    //
    //     // return
    //     return disp;
    // }

}