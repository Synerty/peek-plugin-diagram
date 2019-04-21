import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {
    CanvasInputPos,
    PeekCanvasInputDelegate, PeekCanvasInputDelegateConstructorArgs
} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel, PolylineEnd} from "./PeekCanvasModel.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
import {assert} from "../DiagramUtil";
import {DispBase} from "../tuples/shapes/DispBase";
import {DispPolyline} from "../tuples/shapes/DispPolyline";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";


/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditSelectDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_SELECT_TOOL;

    // CONSTANTS
    STATE_NONE = 0;
    STATE_SELECTING = 1;
    STATE_DRAG_SELECTING = 2;
    STATE_MOVING_RENDERABLE = 3;
    STATE_MOVING_HANDLE = 4;
    STATE_CANVAS_PANNING = 5;
    STATE_CANVAS_ZOOMING = 6;

    private _state = 0; // STATE_NONE;
    private _passedDragThreshold = false;
    private _mouseDownOnSelection = false;
    private _mouseDownOnDisp = false;
    private _mouseDownWithShift = false;
    private _mouseDownWithCtrl = false;
    private _mouseDownMiddleButton = false;
    private _mouseDownRightButton = false;
    private _mouseDownOnHandle = null;


    private _selectedDisps: any[] = [];
    private _selectedPolylineEnds: PolylineEnd[] = [];

    _lastPinchDist = null;

    // See mousedown and mousemove events for explanation
    _startMousePos: CanvasInputPos | null = null;

    constructor(cargs: PeekCanvasInputDelegateConstructorArgs) {
        super(cargs, PeekCanvasInputEditSelectDelegate.TOOL_NAME);

        this._reset();
    }

    _reset() {


        // **** Keep track of state! ****
        this._state = this.STATE_NONE;
        this._passedDragThreshold = false;
        this._mouseDownOnSelection = false;
        this._mouseDownOnDisp = false;
        this._mouseDownWithShift = false;
        this._mouseDownWithCtrl = false;
        this._mouseDownMiddleButton = false;
        this._mouseDownRightButton = false;
        this._mouseDownOnHandle = null;

        this._lastPinchDist = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;
    };

    keyUp(event) {


        // let charCode = (typeof event.which == "number") ? event.which :
        // event.keyCode;
        // alert(charCode + "| pressed");
        let phUpDownZoomFactor = this.cargs.config.mouse.phUpDownZoomFactor;

        // Delete the disp on the canvas
        if (event.keyCode == 46) {
            // let coords = this.cargs.model.selectedDisps();
            // this.cargs.model.deleteDisp(coords);
            // this.cargs.model.clearSelection();

        } else if (event.keyCode == 33) { // Page UP
            let zoom = this.cargs.config.viewPort.zoom;
            zoom *= (1.0 + phUpDownZoomFactor / 100.0);
            this.cargs.config.updateViewPortZoom(zoom);

        } else if (event.keyCode == 34) { // Page Down
            let zoom = this.cargs.config.viewPort.zoom;
            zoom *= (1.0 - phUpDownZoomFactor / 100.0);
            this.cargs.config.updateViewPortZoom(zoom);

            // } else if (event.keyCode == 67) { // the letter c
            //     updateSelectedCoordNodesClosedState(true);


            // } else if (event.keyCode == 79) { // the letter o
            //     updateSelectedCoordNodesClosedState(false);

            // Snap selected objects to grid
            //} else if (String.fromCharCode(event.keyCode) == "S") {
            //    this._snapSelectedCoords();
        }


    };

// fixes a problem where double clicking causes
// text to get selected on the canvas
// mouseSelectStart (event,
// mouse) {
// };

    touchStart(event: TouchEvent, mouse) {

        if (event.targetTouches.length == 2) {
            this._state = this.STATE_CANVAS_ZOOMING;
            this._lastPinchDist = null;
        } else {
            this.mouseDown(event, mouse);
        }
    };

    mouseDown(event, mouse: CanvasInputPos) {


        this._mouseDownWithShift = event.shiftKey;
        this._mouseDownWithCtrl = event.ctrlKey;
        this._mouseDownMiddleButton = event.button == 1;
        this._mouseDownRightButton = event.button == 2;
        this._startMousePos = mouse;
        this._lastMousePos = mouse;

        if (this._mouseDownMiddleButton || this._mouseDownRightButton) {
            this._state = this.STATE_CANVAS_PANNING;
            return;
        }

        let selectedDisps = this.cargs.model.selectedDisps();
        let margin = this.cargs.config.mouse.selecting.margin;// * this.cargs.config.viewPort.zoom;


        for (let disp of selectedDisps) {
            let handles = this.cargs.renderFactory.handles(disp);
            for (let j = 0; j < handles.length; j++) {
                let handle = handles[j];
                if (handle.contains(mouse.x, mouse.y, margin)) {
                    this._mouseDownOnHandle = {
                        disp: disp,
                        handle: handle,
                        handleIndex: j
                    };
                    break;
                }
            }
        }

        for (let i = selectedDisps.length - 1; i >= 0; i--) {
            let r = selectedDisps[i];
            if (this.cargs.renderFactory.contains(r, mouse.x, mouse.y, margin)) {
                this._mouseDownOnSelection = true;
                break;
            }
        }

        if (this._mouseDownOnSelection) {
            this._mouseDownOnDisp = true;
        } else {
            let disps = this.cargs.model.viewableDisps();
            for (let i = disps.length - 1; i >= 0; i--) {
                let r = disps[i];
                if (this.cargs.renderFactory.contains(r, mouse.x, mouse.y, margin)) {
                    this._mouseDownOnDisp = true;
                    break;
                }
            }
        }

        if (this._mouseDownOnDisp) {
            this._state = this.STATE_SELECTING;
        } else {
            this._state = this.STATE_CANVAS_PANNING;
            this.cargs.model.clearSelection();
        }


        if (this._mouseDownOnHandle != null) {
            this._state = this.STATE_MOVING_HANDLE;
        } else {
            this._state = this.STATE_SELECTING;
        }


    };

    touchMove(event: TouchEvent, mouse: CanvasInputPos) {

        if (this._state == this.STATE_CANVAS_ZOOMING) {
            this._touchZoom(event, mouse);

        } else {
            this.mouseMove(event, mouse);

        }

        event.preventDefault();
    };

    _touchZoom(event, mouse) {


        let t1x = event.targetTouches[0].pageX;
        let t1y = event.targetTouches[0].pageY;
        let t2x = event.targetTouches[1].pageX;
        let t2y = event.targetTouches[1].pageY;

        // Get the center coordinate, Average
        let center = {
            clientX: mouse.clientX,
            clientY: mouse.clientY
        };
        console.log(center);

        let dist = Math.sqrt(
            (t1x - t2x) * (t1x - t2x) +
            (t1y - t2y) * (t1y - t2y)
        );

        if (this._lastPinchDist == null) {

            this._lastPinchDist = dist;
            return;
        }

        let delta = this._lastPinchDist - dist;
        this._lastPinchDist = dist;

        // Begin applying zoom / pan
        this._zoomPan(center.clientX, center.clientY, delta)


    };

    _zoomPan(clientX, clientY, delta) {

        if (!delta) {
            return;
        }

        delta = delta * -1; // Correct the zooming to match google maps, etc

        // begin
        let zoom = this.cargs.config.viewPort.zoom;
        let pan = this.cargs.config.viewPort.pan;

        // The PAN is always dead center of the view port.
        // The clientX/clientY are screen pixels relative to the center of the canvas

        // Capture the initial canvas relative position
        let panStart = {
            x: clientX / zoom + pan.x,
            y: clientY / zoom + pan.y
        };

        // Apply Zoom Delta
        zoom *= (1.0 + delta / 100.0);

        // If the zoom won't apply just exit
        if (!(this.cargs.config.viewPort.minZoom < zoom
            && zoom < this.cargs.config.viewPort.maxZoom)) {
            return;
        }

        // Capture the final canvas relative position
        let panEnd = {
            x: clientX / zoom + pan.x,
            y: clientY / zoom + pan.y
        };

        let newPan = {
            x: pan.x + (panStart.x - panEnd.x),
            y: pan.y + (panStart.y - panEnd.y)
        };

        this.cargs.config.updateViewPortPan(newPan);
        this.cargs.config.updateViewPortZoom(zoom);
    };

    mouseMove(event, mouse) {

        if (this._state == this.STATE_NONE)
            return;

        this._passedDragThreshold = this._passedDragThreshold
            || this._hasPassedDragThreshold(this._startMousePos, mouse);

        // State conversion upon dragging
        if (this._state == this.STATE_SELECTING && this._passedDragThreshold) {
            if (this._mouseDownOnSelection) {
                this._state = this.STATE_MOVING_RENDERABLE;

            } else if (this._mouseDownOnDisp) {
                this._changeSelection(this._selectByPoint(this._startMousePos));
                this._state = this.STATE_MOVING_RENDERABLE;

            } else {
                this._state = this.STATE_DRAG_SELECTING;

            }
        }

        switch (this._state) {

            case this.STATE_CANVAS_PANNING: {
                let delta = this._setLastMousePos(mouse);
                // Dragging the mouse left makes a negative delta, we increase X
                // Dragging the mouse up makes a negative delta, we increase Y
                let oldPan = this.cargs.config.viewPort.pan;
                let newPan = {
                    x: oldPan.x - delta.dClientX / this.cargs.config.viewPort.zoom,
                    y: oldPan.y - delta.dClientY / this.cargs.config.viewPort.zoom
                };
                this.cargs.config.updateViewPortPan(newPan);
                break;
            }

            case this.STATE_DRAG_SELECTING: {
                this._lastMousePos = mouse;
                break;
            }

            case this.STATE_MOVING_RENDERABLE: {

                //if (selectedCoords.length == 1 && editorUi.grid.snapping()) {
                //    let snapSize = editorUi.grid.snapSize();
                //    // If any changes were made, then just skip self mouseMove
                //    if (selectedCoords[0].snap(snapSize).deltaApplied)
                //        break;
                //}

                let delta = this._setLastMousePos(mouse);

                for (let disp of this._selectedDisps) {
                    DispBase.deltaMove(disp, delta.dx, delta.dy);
                }

                for (let dispPolylineEnd of this._selectedPolylineEnds) {
                    if (dispPolylineEnd.isStart) {
                        DispPolyline
                            .deltaMoveStart(dispPolylineEnd.polylineDisp, delta.dx, delta.dy);
                    } else {
                        DispPolyline
                            .deltaMoveEnd(dispPolylineEnd.polylineDisp, delta.dx, delta.dy);
                    }

                }
                this.cargs.config.invalidate();

                break;
            }

            case this.STATE_MOVING_HANDLE: {
                // if (!this._passedDragThreshold)
                // break;

                //if (editorUi.grid.snapping()) {
                //    let snapSize = editorUi.grid.snapSize();
                //    let snapDelta = disp.snap(snapSize);
                //    // If any changes were made, then just skip self mouseMove
                //    if (snapDelta.deltaApplied)
                //        break;
                //}

                let delta = this._setLastMousePos(mouse);

                let h = this._mouseDownOnHandle;

                assert(h != null, "selected handler is null");
                DispBase.deltaMoveHandle(h.disp, h.handleIndex, delta.dx, delta.dy);

                break;
            }


        }

        this.cargs.config.invalidate()
    };

    touchEnd(event: TouchEvent, mouse) {
        this.mouseUp(event, mouse);

    }

    mouseUp(event, mouse) {


        // Store the change
        switch (this._state) {
            case this.STATE_SELECTING:
            case this.STATE_DRAG_SELECTING:

                let hits = [];
                if (this._state == this.STATE_SELECTING)
                    hits = this._selectByPoint(this._startMousePos);
                else if (this._state == this.STATE_DRAG_SELECTING)
                    hits = this._selectByBox(this._startMousePos, mouse);
                else
                    assert(false, "Invalid state");

                this._changeSelection(hits);
                break;

            case this.STATE_MOVING_RENDERABLE:
            case this.STATE_MOVING_HANDLE:
                let selectedCoords = this.cargs.model.selectedDisps();
                for (let i = selectedCoords.length - 1; i >= 0; i--) {
                    console.log("TODO, Store node move states");
                    // selectedCoords[i].storeState();
                }

                // TODO, Not a nice structure this is a hack
                // We need a proper structure

                console.log("TODO, this.canvasInput._notifyOfChange");
                // this.canvasInput._notifyOfChange(selectedCoords);
                break;
        }

        this._reset();
        this.cargs.config.invalidate()
    };

    mouseDoubleClick(event, mouse) {


        let hits = this._selectByTypeAndBounds(mouse);
        this.cargs.model.addSelection(hits);
    };

    // mouseWheel(event, mouse) {
    //     let delta = event.deltaY || event.wheelDelta;
    //
    //     // Overcome windows zoom multipliers
    //     if (15 < delta)
    //         delta = 15;
    //
    //     if (delta < -15)
    //         delta = -15;
    //
    //     this._zoomPan(mouse.clientX, mouse.clientY, delta);
    // };

    draw(ctx, zoom, pan) {


        switch (this._state) {
            case this.STATE_DRAG_SELECTING:
                let zoom = this.cargs.config.viewPort.zoom;
                let x = this._startMousePos.x;
                let y = this._startMousePos.y;
                let w = this._lastMousePos.x - this._startMousePos.x;
                let h = this._lastMousePos.y - this._startMousePos.y;

                ctx.strokeStyle = this.cargs.config.mouse.selecting.color;
                ctx.lineWidth = this.cargs.config.mouse.selecting.width / zoom;
                ctx.dashedRect(x, y, w, h, this.cargs.config.mouse.selecting.dashLen / zoom);
                ctx.stroke();
                break;

            case this.STATE_NONE:
                break;
        }
    };

    _selectByPoint(mouse) {


        let margin = this.cargs.config.mouse.selecting.margin;//* this.cargs.config.viewPort.zoom;

        let coords = this.cargs.model.viewableDisps();
        let hits = coords.filter((i) => {
            return this.cargs.renderFactory.contains(i, mouse.x, mouse.y, margin);
        }, this);

        // Sort by size, largest to smallest.
        // This ensures we can select smaller items when required.
        hits.sort((a, b) => this.cargs.renderFactory
            .selectionPriotityCompare(a, b));

        // Only select
        if (!this._mouseDownWithCtrl && hits.length)
            hits = [hits[hits.length - 1]];

        return hits;
    };

    _selectByBox(mouse1, mouse2) {
        let coords = this.cargs.model.viewableDisps();

        let b = PeekCanvasBounds.fromGeom([mouse1, mouse2]);

        return coords.filter((i) => {
            return this.cargs.renderFactory.withIn(i, b.x, b.y, b.w, b.h);
        });
    };

    _selectByTypeAndBounds(mouse) {


        let hits = this._selectByPoint(mouse);
        if (!hits.length)
            return [];

        let masterCoord = hits[hits.length - 1];
        let coords = this.cargs.model.viewableDisps();

        return coords.filter((i) => {
            return this.cargs.renderFactory.similarTo(i, masterCoord);
        });
    };

    _changeSelection(hits) {


        // Remove clicked on thing
        if (this._mouseDownOnSelection && this._mouseDownWithShift) {
            this.cargs.model.removeSelection(hits);

        } else {
            // Remove all previous selection
            if (!this._mouseDownWithShift) {
                this.cargs.model.clearSelection();
            }

            this.cargs.model.addSelection(hits);
        }

        this._selectedDisps = this.cargs.model.dispsInSelectedGroups();

        this._selectedPolylineEnds = this.cargs.model
            .polylinesConnectedToDispKey(DispBase.keys(this._selectedDisps));


    };

    //_snapSelectedCoords  () {
    //
    //
    //    /**
    //     * Snap Selected Coords
    //     *
    //     * Applies the current grid to all the selected coords
    //     */
    //    let snapSize = editorUi.grid.snapSize();
    //    let selectedCoords = this.cargs.model.selectedDisps();
    //    for (let i = selectedCoords.length - 1; i >= 0; i--) {
    //        let disp = selectedCoords[i];
    //        if (disp.snap(snapSize).deltaApplied) {
    //            disp.storeState();
    //        }
    //    }
    //
    //    // TODO, Not a nice structure this is a hack
    //    // We need a proper structure
    //    this.canvasInput._notifyOfChange(selectedCoords);
    //    editorRenderer.invalidate();
    //};

}