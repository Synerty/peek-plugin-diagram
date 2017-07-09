import {MousePos, PeekCanvasInputDelegate} from "./PeekCanvasInputDelegate";
import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekCanvasModel} from "./PeekCanvasModel";
import {PeekCanvasInput} from "./PeekCanvasInput";
import * as assert from "assert";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputSelectDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME: "SELECT";

    // CONSTANTS
    STATE_NONE = 0;
    STATE_SELECTING = 1;
    STATE_DRAG_SELECTING = 2;
    STATE_MOVING_RENDERABLE = 3;
    STATE_MOVING_HANDLE = 4;
    STATE_CANVAS_PANNING = 5;
    STATE_CANVAS_ZOOMING = 6;

    _state = 0; // STATE_NONE;
    _passedDragThreshold = false;
    _mouseDownOnSelection = false;
    _mouseDownOnCoord = false;
    _mouseDownWithShift = false;
    _mouseDownWithCtrl = false;
    _mouseDownMiddleButton = false;
    _mouseDownRightButton = false;
    _mouseDownOnHandle = null;

    _lastPinchDist = null;

    // See mousedown and mousemove events for explanation
    _startMousePos: MousePos | null = null;

    constructor(private canvasInput: PeekCanvasInput,
                private config: PeekCanvasConfig,
                private model: PeekCanvasModel,
                private dispDelegate: PeekDispRenderFactory) {
        super(PeekCanvasInputSelectDelegate.TOOL_NAME);

        this._reset();
    }

    _reset() {


        // **** Keep track of state! ****
        this._state = this.STATE_NONE;
        this._passedDragThreshold = false;
        this._mouseDownOnSelection = false;
        this._mouseDownOnCoord = false;
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
        let phUpDownZoomFactor = this.config.mouse.phUpDownZoomFactor;

        // Delete the coord on the canvas
        if (event.keyCode == 46) {
            // let coords = this.model.selectedDisps();
            // this.model.deleteDisp(coords);
            // this.model.clearSelection();

        } else if (event.keyCode == 33) { // Page UP
            let zoom = this.config.canvas.zoom;
            zoom *= (1.0 + phUpDownZoomFactor / 100.0);
            this.config.updateZoom(zoom);

        } else if (event.keyCode == 34) { // Page Down
            let zoom = this.config.canvas.zoom;
            zoom *= (1.0 - phUpDownZoomFactor / 100.0);
            this.config.updateZoom(zoom);

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

    touchStart(event, mouse) {


        if (event.targetTouches.length == 2) {
            this._state = this.STATE_CANVAS_ZOOMING;
            this._lastPinchDist = null;
        } else {
            this.mouseDown(event, mouse);
        }
    };

    mouseDown(event, mouse) {


        this._mouseDownWithShift = event.shiftKey;
        this._mouseDownWithCtrl = event.ctrlKey;
        this._mouseDownMiddleButton = event.button == 1;
        this._mouseDownRightButton = event.button == 2;
        let panTouch = event.targetTouches && event.targetTouches.length == 1;
        this._startMousePos = mouse;
        this._lastMousePos = mouse;

        if (this._mouseDownMiddleButton || this._mouseDownRightButton || panTouch) {
            this._state = this.STATE_CANVAS_PANNING;
            return;
        }

        let selectedDisps = this.model.selectedDisps();


        for (let i = selectedDisps.length - 1; i >= 0; i--) {
            let coord = selectedDisps[i];
            let handles = this.dispDelegate.handles(coord);
            for (let j = 0; j < handles.length; j++) {
                let handle = handles[j];
                if (handle.contains(mouse.x, mouse.y)) {
                    this._mouseDownOnHandle = {
                        coord: coord,
                        handle: handle,
                        handleIndex: j
                    };
                    break;
                }
            }
        }

        let margin = this.config.mouse.selecting.margin;// * this.config.canvas.zoom;

        for (let i = selectedDisps.length - 1; i >= 0; i--) {
            let r = selectedDisps[i];
            if (this.dispDelegate.contains(r, mouse.x, mouse.y, margin)) {
                this._mouseDownOnSelection = true;
                break;
            }
        }

        if (this._mouseDownOnSelection) {
            this._mouseDownOnCoord = true;
        } else {
            let disps = this.model.selectableDisps();
            for (let i = disps.length - 1; i >= 0; i--) {
                let r = disps[i];
                if (this.dispDelegate.contains(r, mouse.x, mouse.y, margin)) {
                    this._mouseDownOnCoord = true;
                    break;
                }
            }
        }

        if (this._mouseDownOnCoord) {
            this._state = this.STATE_SELECTING;
        } else {
            this._state = this.STATE_CANVAS_PANNING;
            this.model.clearSelection();
        }


        /*
         if (this._mouseDownOnHandle != null) {
         this._state = this.STATE_MOVING_HANDLE;
         }else {
         this._state = this.STATE_SELECTING;
         }
         */


    };

    touchMove(event, mouse) {

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
        let zoom = this.config.canvas.zoom;
        let pan = this.config.canvas.pan;

        // Capture the initial canvas relative position
        let panStart = {
            x: clientX / zoom + pan.x,
            y: clientY / zoom + pan.y
        };

        // Apply Zoom Delta
        zoom *= (1.0 + delta / 100.0);

        // If the zoom won't apply just exit
        if (!(this.config.canvas.minZoom < zoom
            && zoom < this.config.canvas.maxZoom)) {
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
        this.config.updatePan(newPan);
        this.config.updateZoom(zoom);

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

            } else if (this._mouseDownOnCoord) {
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
                let oldPan = this.config.canvas.pan;
                let newPan = {
                    x: oldPan.x - delta.dClientX / this.config.canvas.zoom,
                    y: oldPan.y - delta.dClientY / this.config.canvas.zoom
                };
                this.config.updatePan(newPan);
                break;
            }

            case this.STATE_DRAG_SELECTING: {
                this._lastMousePos = mouse;
                break;
            }

            case this.STATE_MOVING_RENDERABLE:
            case this.STATE_MOVING_HANDLE: {

                let selectedCoords = this.model.selectedDisps();

                //if (selectedCoords.length == 1 && editorUi.grid.snapping()) {
                //    let snapSize = editorUi.grid.snapSize();
                //    // If any changes were made, then just skip self mouseMove
                //    if (selectedCoords[0].snap(snapSize).deltaApplied)
                //        break;
                //}

                let delta = this._setLastMousePos(mouse);

                for (let i = selectedCoords.length - 1; i >= 0; --i) {
                    this.dispDelegate.deltaMove(selectedCoords[i], delta.dx, delta.dy);
                }

                if (selectedCoords.length != 0) {
                    this.config.invalidate();
                    break;
                }

                if (this._state == this.STATE_MOVING_HANDLE) {
                    // if (!this._passedDragThreshold)
                    // break;

                    //let coord = this.model.selectedDisps()[0];

                    //if (editorUi.grid.snapping()) {
                    //    let snapSize = editorUi.grid.snapSize();
                    //    let snapDelta = coord.snap(snapSize);
                    //    // If any changes were made, then just skip self mouseMove
                    //    if (snapDelta.deltaApplied)
                    //        break;
                    //}

                    let delta = this._setLastMousePos(mouse);

                    let h = this._mouseDownOnHandle;

                    assert(h != null, "selected handler is null");
                    h.coord.deltaMoveHandle(delta.dx, delta.dy, h.handle, h.handleIndex);
                }

                break;
            }

        }

        this.config.invalidate()
    };

    touchEnd(event, mouse) {

        this.mouseUp(event, mouse);

    };

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
                let selectedCoords = this.model.selectedDisps();
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
        this.config.invalidate()
    };

    mouseDoubleClick(event, mouse) {


        let hits = this._selectByTypeAndBounds(mouse);
        this.model.addSelection(hits);
    };

    mouseWheel(event, mouse) {

        let delta = event.deltaY || event.wheelDelta;

        // Overcome windows zoom multipliers
        if (15 < delta)
            delta = 15;

        if (delta < -15)
            delta = -15;

        this._zoomPan(mouse.clientX, mouse.clientY, delta);
    };

    draw(ctx) {


        switch (this._state) {
            case this.STATE_DRAG_SELECTING:
                let zoom = this.config.canvas.zoom;
                let x = this._startMousePos.x;
                let y = this._startMousePos.y;
                let w = this._lastMousePos.x - this._startMousePos.x;
                let h = this._lastMousePos.y - this._startMousePos.y;

                ctx.strokeStyle = this.config.mouse.selecting.color;
                ctx.lineWidth = this.config.mouse.selecting.width / zoom;
                ctx.dashedRect(x, y, w, h, this.config.mouse.selecting.dashLen / zoom);
                ctx.stroke();
                break;

            case this.STATE_NONE:
                break;
        }
    };

    _selectByPoint(mouse) {


        let margin = this.config.mouse.selecting.margin;//* this.config.canvas.zoom;

        let coords = this.model.selectableDisps();
        let hits = coords.filter( (i) => {
            return this.dispDelegate.contains(i, mouse.x, mouse.y, margin);
        }, this);

        // Sort by size, largest to smallest.
        // This ensures we can select smaller items when required.
        hits.sort(this.dispDelegate.selectionPriotityCompare);

        // Only select
        if (!this._mouseDownWithCtrl && hits.length)
            hits = [hits[hits.length - 1]];

        return hits;
    };

    _selectByBox(mouse1, mouse2) {


        let coords = this.model.selectableDisps();

        let b = PeekCanvasBounds.fromGeom([mouse1, mouse2]);

        return coords.filter( (i) => {
            return this.dispDelegate.withIn(i, b.x, b.y, b.w, b.h);
        });
    };

    _selectByTypeAndBounds(mouse) {


        let hits = this._selectByPoint(mouse);
        if (!hits.length)
            return [];

        let masterCoord = hits[hits.length - 1];
        let coords = this.model.selectableDisps();

        return coords.filter( (i) => {
            return this.dispDelegate.similarTo(i, masterCoord);
        });
    };

    _changeSelection(hits) {


        // Remove clicked on thing
        if (this._mouseDownOnSelection && this._mouseDownWithShift) {
            this.model.removeSelection(hits);

        } else {
            if (!this._mouseDownWithShift)
            // Remove all previous selection
                this.model.clearSelection();

            // // Selecting more
            // this.model.clearSelection();

            this.model.addSelection(hits);
        }

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
    //    let selectedCoords = this.model.selectedDisps();
    //    for (let i = selectedCoords.length - 1; i >= 0; i--) {
    //        let coord = selectedCoords[i];
    //        if (coord.snap(snapSize).deltaApplied) {
    //            coord.storeState();
    //        }
    //    }
    //
    //    // TODO, Not a nice structure this is a hack
    //    // We need a proper structure
    //    this.canvasInput._notifyOfChange(selectedCoords);
    //    editorRenderer.invalidate();
    //};

}