import {
    CanvasInputPos,
    InputDelegateConstructorArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {DispPoly} from "../tuples/shapes/DispPoly";
import {DispBaseT, PointI} from "../tuples/shapes/DispBase";
import {DispPolygon} from "../tuples/shapes/DispPolygon";
import {DispPolyline} from "../tuples/shapes/DispPolyline";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeDispPolyDelegate extends PeekCanvasInputDelegate {



    // Stores the rectangle being created
    private _creating = null;

    // Used to detect dragging and its the mouse position we use
    private _startMousePos: CanvasInputPos | null = null;
    private _startNodeDisp = null;
    private _endNodeDisp = null;

    private _nodes = []; //canvasInput._scope.pageData.modelRenderables;

    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor,
                tool: EditorToolType) {
        super(viewArgs, canvasEditor, tool);

        this._reset();
    }

    _reset() {
        this._creating = null;
        this._startMousePos = null;
        this._startNodeDisp = null;
        this._endNodeDisp = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = new CanvasInputPos();
        ;
    }


    keyUp(event) {
        if (!this._creating)
            return;

        // Cancel creating object
        if (event.keyCode == 46 // delete
            || event.keyCode == 27) { // escape
            this._reset();
            return;
        }

        if (event.keyCode == 8) { // Backspace
            // We want to keep at least two points at all times
            if (DispPoly.pointCount(this._creating) < 3)
                return;
            // Remove last point
            DispPoly.popPoint(this._creating);
            this.viewArgs.config.invalidate();
            return;
        }

        if (event.keyCode == 13) { // Enter
            this._finaliseCreate();
            return;
        }
    }


    private _nodeDispClickedOn(point: PointI): DispBaseT | null {

        for (let i = this._nodes.length - 1; 0 <= i; i--) {
            let disp = this._nodes[i];
            if (disp.bounds != null && disp.bounds.contains(point.x, point.y)) {
                return disp;
            }
        }

        return null;
    }


    // ---------------
    // Map mouse events
    mouseDown(event: MouseEvent, inputPos: CanvasInputPos) {
        this.inputStart(inputPos);
    }


    mouseMove(event: MouseEvent, inputPos: CanvasInputPos) {
        this.inputMove(inputPos);
    }

    mouseUp(event: MouseEvent, inputPos: CanvasInputPos) {
        if (event.button == 2) {
            this._finaliseCreate();
            return;
        }
        this.inputEnd(inputPos, event.shiftKey);
    }

    mouseDoubleClick(event: MouseEvent, inputPos: CanvasInputPos) {
        this._finaliseCreate();
    }


    // ---------------
    // Map touch events
    touchStart(event: TouchEvent, inputPos: CanvasInputPos) {
        if (event.touches.length == 2) {
            this._finaliseCreate();
            return;
        }

        this.inputStart(inputPos);
    };

    touchMove(event: TouchEvent, inputPos: CanvasInputPos) {
        this.inputMove(inputPos);
    };

    touchEnd(event: TouchEvent, inputPos: CanvasInputPos) {
        this.inputEnd(inputPos);
    };


    // ---------------
    // Start logic
    private inputStart(inputPos: CanvasInputPos) {

        /*
                if (this._startNodeDisp) {
                    this._startMousePos = inputPos;
                    return;
                }


                this._startNodeDisp = this._nodeDispClickedOn(inputPos);

                if (!this._startNodeDisp) {
                    this.canvasEditor.balloonMsg.showWarning("A conductor must start on a node");
                    this._reset();
                    // this.canvasInput._scope.pageMethods.cableCreateCallback();
                    return;
                }
        */
        this._startMousePos = inputPos;
    }


    private inputMove(inputPos: CanvasInputPos) {
        if (!this._creating)
            return;

        let delta = this._setLastMousePos(inputPos);
        DispPoly.deltaMoveHandle(
            this._creating,
            DispPoly.pointCount(this._creating) - 1,
            delta.dx, delta.dy
        );
        this.viewArgs.config.invalidate();
    }

    private inputEnd(inputPos: CanvasInputPos, shiftKey: boolean = false) {


        if (!this._startMousePos)
            return;

        let dragged = this._hasPassedDragThreshold(this._startMousePos, inputPos);
        let point = this._coord(this._startMousePos, shiftKey);
        this._startMousePos = null;

        if (dragged)
            return;

        if (!this._creating) {
            this.createDisp(inputPos);

        }

        DispPoly.addPoint(this._creating, point);

        this.viewArgs.config.invalidate();
        this._creating = this.canvasEditor.branchContext.branchTuple
            .addOrUpdateDisp(this._creating);
    }

    delegateWillBeTornDown() {
        //this._finaliseCreate();
    }

    draw(ctx, zoom, pan) {
    }


    private createDisp(inputPos: CanvasInputPos) {

        // Create the Disp
        if (this.NAME == EditorToolType.EDIT_MAKE_POLYGON)
            this._creating = DispPolygon.create(this.viewArgs.config.coordSet);
        else
            this._creating = DispPolyline.create(this.viewArgs.config.coordSet);

        DispPoly.addPoint(this._creating, inputPos);
        this._setLastMousePos(inputPos);

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

        let poly = this._creating;
        let startNodeDisp = this._startNodeDisp;
        let endNodeDisp = null;

        this._reset();

        if (poly) {
            let lastPointCoord = DispPoly.lastPoint(poly);
            endNodeDisp = this._nodeDispClickedOn(lastPointCoord);
        }

        if (!endNodeDisp) {
            // this.canvasEditor.balloonMsg.showWarning("A conductor must end on a node");
            poly = null;
        }

        // this.canvasInput._scope.pageMethods.cableCreateCallback(poly, startNodeDisp, endNodeDisp);

        this.viewArgs.config.invalidate();
        this.canvasEditor.setEditorSelectTool();
    }

    private _coord(mouse: CanvasInputPos, shiftKey: boolean = false): PointI {
        let point = {x: mouse.x, y: mouse.y};

        //// Snap if required
        //if (editorUi.grid.snapping())
        //    disp.snap(editorUi.grid.snapSize());

        // When the shift key is pressed, we will align to x or y axis
        if (this._creating != null && shiftKey) {
            let lastPoint = DispPoly.lastPoint(this._creating);
            let dx = Math.abs(point.x - lastPoint.x);
            let dy = Math.abs(point.y - lastPoint.y);

            if (dx > dy)
                point.y = lastPoint.y;
            else
                point.x = lastPoint.x;
        }

        // return
        return point;
    }

}