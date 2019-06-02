import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {
    CanvasInputDeltaI,
    CanvasInputPos,
    InputDelegateConstructorArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import {PolylineEnd} from "./PeekCanvasModelQuery.web";
import {assert} from "../DiagramUtil";
import {DispBase, DispBaseT, DispType, PointI} from "../tuples/shapes/DispBase";
import {DispPolyline, DispPolylineT} from "../tuples/shapes/DispPolyline";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {DispFactory} from "../tuples/shapes/DispFactory";

interface SecondarySelectionI {

}

interface HandleI {
    disp: DispBaseT,
    handle: PeekCanvasBounds,
    handleIndex: number
}

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
    private readonly STATE_NONE = 0;
    private readonly STATE_SELECTING = 1;
    private readonly STATE_DRAG_SELECTING = 2;
    private readonly STATE_MOVING_DISP = 3;
    private readonly STATE_MOVING_HANDLE = 4;
    private readonly STATE_CANVAS_PANNING = 5;
    private readonly STATE_CANVAS_ZOOMING = 6;

    private _state = 0; // STATE_NONE;
    private _passedDragThreshold: boolean = false;
    private _mouseDownOnSelection: boolean = false;
    private _mouseDownOnDisp: boolean = false;
    private _mouseDownWithShift: boolean = false;
    private _mouseDownWithCtrl: boolean = false;
    private _mouseDownMiddleButton: boolean = false;
    private _mouseDownRightButton: boolean = false;
    private _mouseDownOnHandle: HandleI | null = null;


    private _selectionRelatedDisps: any[] = [];
    private _selectedPolylineEnds: PolylineEnd[] = [];

    private _needsDispsAddedToBranchForUpdate: boolean = false;

    private _lastPinchDist = null;

    // See mousedown and mousemove events for explanation
    private _startMousePos: CanvasInputPos | null = null;

    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor, PeekCanvasInputEditSelectDelegate.TOOL_NAME);

        this._reset();
    }

    private _reset() {


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
        this._needsDispsAddedToBranchForUpdate = false;

        this._lastPinchDist = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;
    };

    // ------------------------------------------------------------------------
    // Public delete method, used by the toolbar as well.

    deleteSelectedDisps() {

        let disps = this.viewArgs.model.selection.selectedDisps();
        let groupSelections = this.viewArgs.model.query.dispsInSelectedGroups;
        this.viewArgs.model.selection.clearSelection();

        this.canvasEditor.branchContext.branchTuple.removeDisps(disps);
        this.canvasEditor.branchContext.branchTuple.removeDisps(groupSelections);
    }

    // ------------------------------------------------------------------------
    // Input handlers

    keyUp(event) {


        // let charCode = (typeof event.which == "number") ? event.which :
        // event.keyCode;
        // alert(charCode + "| pressed");
        let phUpDownZoomFactor = this.viewArgs.config.mouse.phUpDownZoomFactor;

        // Delete the disp on the canvas
        if (event.keyCode == 46 // delete?
            || event.keyCode == 91 // macOS command+delete
            || event.keyCode == 8) { // macOS "delete"
            this.deleteSelectedDisps()

        } else if (event.keyCode == 33) { // Page UP
            let zoom = this.viewArgs.config.viewPort.zoom;
            zoom *= (1.0 + phUpDownZoomFactor / 100.0);
            this.viewArgs.config.updateViewPortZoom(zoom);

        } else if (event.keyCode == 34) { // Page Down
            let zoom = this.viewArgs.config.viewPort.zoom;
            zoom *= (1.0 - phUpDownZoomFactor / 100.0);
            this.viewArgs.config.updateViewPortZoom(zoom);

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

    touchStart(event: TouchEvent, inputPos: CanvasInputPos) {

        if (event.targetTouches.length == 2) {
            this._state = this.STATE_CANVAS_ZOOMING;
            this._lastPinchDist = null;
        } else {
            this.mouseDown(event, inputPos);
        }
    };

    mouseDown(event, inputPos: CanvasInputPos) {


        this._mouseDownWithShift = event.shiftKey;
        this._mouseDownWithCtrl = event.ctrlKey;
        this._mouseDownMiddleButton = event.button == 1;
        this._mouseDownRightButton = event.button == 2;
        this._startMousePos = inputPos;
        this._lastMousePos = inputPos;

        if (this._mouseDownMiddleButton || this._mouseDownRightButton) {
            this._state = this.STATE_CANVAS_PANNING;
            return;
        }

        let selectedDisps = this.viewArgs.model.selection.selectedDisps();
        let margin = this.viewArgs.config.mouse.selecting.margin / this.viewArgs.config.viewPort.zoom;


        for (let disp of selectedDisps) {
            let handles = this.viewArgs.renderFactory.handles(disp);
            for (let j = 0; j < handles.length; j++) {
                let handle = handles[j];
                if (handle.contains(inputPos.x, inputPos.y, margin)) {
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
            if (this.viewArgs.renderFactory.contains(r, inputPos.x, inputPos.y, margin)) {
                this._mouseDownOnSelection = true;
                break;
            }
        }

        if (this._mouseDownOnSelection) {
            this._mouseDownOnDisp = true;
        } else {
            let disps = this.viewArgs.model.viewableDisps();
            for (let i = disps.length - 1; i >= 0; i--) {
                let r = disps[i];
                if (this.viewArgs.renderFactory.contains(r, inputPos.x, inputPos.y, margin)) {
                    this._mouseDownOnDisp = true;
                    break;
                }
            }
        }

        if (this._mouseDownOnDisp) {
            this._state = this.STATE_SELECTING;
        } else {
            this._state = this.STATE_CANVAS_PANNING;
            this.viewArgs.model.selection.clearSelection();
        }


        if (this._mouseDownOnHandle != null) {
            // Ensure there is only one item selected
            if (this.viewArgs.model.selection.selectedDisps().length != 1) {
                this.viewArgs.model.selection
                    .replaceSelection(this._mouseDownOnHandle.disp);
            }
            this.startStateMovingHandle(inputPos);
        } else {
            this._state = this.STATE_SELECTING;
        }


    };

    touchMove(event: TouchEvent, inputPos: CanvasInputPos) {

        if (this._state == this.STATE_CANVAS_ZOOMING) {
            this._touchZoom(event, inputPos);

        } else {
            this.mouseMove(event, inputPos);

        }

        event.preventDefault();
    };

    private _touchZoom(event, inputPos: CanvasInputPos) {


        let t1x = event.targetTouches[0].pageX;
        let t1y = event.targetTouches[0].pageY;
        let t2x = event.targetTouches[1].pageX;
        let t2y = event.targetTouches[1].pageY;

        // Get the center coordinate, Average
        let center = {
            clientX: inputPos.clientX,
            clientY: inputPos.clientY
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

    private _zoomPan(clientX, clientY, delta) {

        if (!delta) {
            return;
        }

        delta = delta * -1; // Correct the zooming to match google maps, etc

        // begin
        let zoom = this.viewArgs.config.viewPort.zoom;
        let pan = this.viewArgs.config.viewPort.pan;

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
        if (!(this.viewArgs.config.viewPort.minZoom < zoom
            && zoom < this.viewArgs.config.viewPort.maxZoom)) {
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

        this.viewArgs.config.updateViewPortPan(newPan);
        this.viewArgs.config.updateViewPortZoom(zoom);
    };

    mouseMove(event, inputPos: CanvasInputPos) {

        if (this._state == this.STATE_NONE)
            return;

        this._passedDragThreshold = this._passedDragThreshold
            || this._hasPassedDragThreshold(this._startMousePos, inputPos);

        // State conversion upon dragging
        if (this._state == this.STATE_SELECTING && this._passedDragThreshold) {
            if (this._mouseDownOnSelection) {
                this.startStateMovingDisp(inputPos);

            } else if (this._mouseDownOnDisp) {
                this._changeSelection(this._selectByPoint(this._startMousePos));
                this.startStateMovingDisp(inputPos);

            } else {
                this._state = this.STATE_DRAG_SELECTING;

            }
        }

        switch (this._state) {

            case this.STATE_CANVAS_PANNING: {
                let delta = this._setLastMousePos(inputPos, false);
                // Dragging the mouse left makes a negative delta, we increase X
                // Dragging the mouse up makes a negative delta, we increase Y
                let oldPan = this.viewArgs.config.viewPort.pan;
                let newPan = {
                    x: oldPan.x - delta.dClientX / this.viewArgs.config.viewPort.zoom,
                    y: oldPan.y - delta.dClientY / this.viewArgs.config.viewPort.zoom
                };
                this.viewArgs.config.updateViewPortPan(newPan);
                break;
            }

            case this.STATE_DRAG_SELECTING: {
                this._lastMousePos = inputPos;
                break;
            }

            case this.STATE_MOVING_DISP: {
                let delta = this._setLastMousePos(inputPos);
                this.deltaMoveSelection(delta);
                break;
            }

            case this.STATE_MOVING_HANDLE: {
                let delta = this._setLastMousePos(inputPos);
                this.deltaMoveSelection(delta);
                break;
            }


        }

        this.viewArgs.config.invalidate()
    };

    touchEnd(event: TouchEvent, mouse) {
        this.mouseUp(event, mouse);

    }

    mouseUp(event, inputPos: CanvasInputPos) {
        // Store the change
        switch (this._state) {
            case this.STATE_SELECTING:
            case this.STATE_DRAG_SELECTING:

                let hits = [];
                if (this._state == this.STATE_SELECTING)
                    hits = this._selectByPoint(this._startMousePos);

                else if (this._state == this.STATE_DRAG_SELECTING)
                    hits = this._selectByBox(this._startMousePos, inputPos);

                else
                    assert(false, "Invalid state");

                this._changeSelection(hits);
                break;

            case this.STATE_MOVING_DISP:
                this.finishStateMovingDisp();
                break;

            case this.STATE_MOVING_HANDLE:
                this.finishStateMovingHandle();
                break;
        }

        this._reset();
        this.viewArgs.config.invalidate()
    };

    mouseDoubleClick(event, inputPos: CanvasInputPos) {
        let hits = this._selectByTypeAndBounds(inputPos);
        this.viewArgs.model.selection.addSelection(hits);
    };

    mouseWheel(event, inputPos: CanvasInputPos) {
        let delta = event.deltaY || event.wheelDelta;

        // Overcome windows zoom multipliers
        if (15 < delta)
            delta = 15;

        if (delta < -15)
            delta = -15;

        this._zoomPan(inputPos.clientX, inputPos.clientY, delta);
    };

    draw(ctx, zoom: number, pan: PointI, forEdit: boolean) {


        switch (this._state) {
            case this.STATE_DRAG_SELECTING:
                let zoom = this.viewArgs.config.viewPort.zoom;
                let x = this._startMousePos.x;
                let y = this._startMousePos.y;
                let w = this._lastMousePos.x - this._startMousePos.x;
                let h = this._lastMousePos.y - this._startMousePos.y;

                ctx.strokeStyle = this.viewArgs.config.mouse.selecting.color;
                ctx.lineWidth = this.viewArgs.config.mouse.selecting.width / zoom;
                ctx.dashedRect(x, y, w, h, this.viewArgs.config.mouse.selecting.dashLen / zoom);
                ctx.stroke();
                break;

            case this.STATE_NONE:
                break;
        }
    }

    // ------------------------------------------------------------------------
    // Methods for changing to the move states

    private startStateMovingHandle(inputPos: CanvasInputPos) {
        this._state = this.STATE_MOVING_HANDLE;
        this.prepareHandleMove();
        this.addDispsToBranchForUpdate(inputPos);
    }

    private finishStateMovingHandle() {
    }


    private startStateMovingDisp(inputPos: CanvasInputPos) {
        this._state = this.STATE_MOVING_DISP;
        this.prepareSelectionForMove();
        this.addDispsToBranchForUpdate(inputPos);
    }


    private finishStateMovingDisp() {
    }


    // ------------------------------------------------------------------------
    // Methods for finding the disps

    private _selectByPoint(inputPos: CanvasInputPos) {


        let margin = this.viewArgs.config.mouse.selecting.margin / this.viewArgs.config.viewPort.zoom;

        let coords = this.viewArgs.model.viewableDisps();
        let hits = coords.filter((i) => {
            return this.viewArgs.renderFactory.contains(i, inputPos.x, inputPos.y, margin);
        }, this);

        // Sort by size, largest to smallest.
        // This ensures we can select smaller items when required.
        hits.sort((a, b) => this.viewArgs.renderFactory
            .selectionPriorityCompare(a, b));

        // Only select
        if (!this._mouseDownWithCtrl && hits.length)
            hits = [hits[hits.length - 1]];

        return hits;
    }

    private _selectByBox(inputPos1: CanvasInputPos, inputPos2: CanvasInputPos) {
        let coords = this.viewArgs.model.viewableDisps();

        let b = PeekCanvasBounds.fromGeom([inputPos1, inputPos2]);

        return coords.filter(
            i => this.viewArgs.renderFactory.withIn(i, b.x, b.y, b.w, b.h)
        );
    }

    private _selectByTypeAndBounds(inputPos: CanvasInputPos) {

        let hits = this._selectByPoint(inputPos);
        if (!hits.length)
            return [];

        let masterCoord = hits[hits.length - 1];
        let coords = this.viewArgs.model.viewableDisps();

        return coords.filter((i) => {
            return this.viewArgs.renderFactory.similarTo(i, masterCoord);
        });
    }

    private _changeSelection(hits) {
        // Remove clicked on thing
        if (this._mouseDownOnSelection && this._mouseDownWithShift) {
            this.viewArgs.model.selection.removeSelection(hits);

        } else {
            // Remove all previous selection
            if (this._mouseDownWithShift)
                this.viewArgs.model.selection.addSelection(hits);
            else
                this.viewArgs.model.selection.replaceSelection(hits);
        }

    }

    // ------------------------------------------------------------------------
    // Methods for setting the selection based on hits

    private prepareHandleMove() {
        this._selectionRelatedDisps = [];
        this._selectedPolylineEnds = [];

        const h = this._mouseDownOnHandle;
        if (!DispPolyline.isStartHandle(h.disp, h.handleIndex)
            && !DispPolyline.isEndHandle(h.disp, h.handleIndex))
            return;

        let key = null;
        let end: PolylineEnd = {
            isStart: DispPolyline.isStartHandle(h.disp, h.handleIndex),
            polylineDisp: <DispPolylineT>h.disp
        };

        if (end.isStart)
            key = DispPolyline.startKey(<DispPolylineT>h.disp);
        else    // It must be the end
            key = DispPolyline.endKey(<DispPolylineT>h.disp);

        // If there is no key, then we don't need to move anything related
        if (key == null || key.length == 0) {
            this._selectedPolylineEnds.push(end);
            return;
        }

        // ELSE, We need to
        // 1) Add all the ends that have a matching key
        // 2) Add all the shapes that have a matching key
        // 3) Add all shapes in the groups of those shapes

        // This IS the end of the polyline
        // this._selectedPolylineEnds.add(this.viewArgs.model.query
        //     .polylinesConnectedToDispKey(DispBase.keys(this._selectionRelatedDisps))
        // );

    }

    /*
    private prepareSelectionForPolylineLineEndMove() {
        this._selectionRelatedDisps = [];
        this._selectedPolylineEnds = [];

        this._selectionRelatedDisps.add(this.viewArgs.model.query.dispsInSelectedGroups);
        // If we have polylines selected, add the shapes they are connected to as well
        // let dispKeysAtEndsOfPolylines = DispPolyline
        //     .startEndKeys(this.viewArgs.model.selection.selectedDisps());


        this._selectedPolylineEnds.add(this.viewArgs.model.query
            .polylinesConnectedToDispKey(DispBase.keys(this._selectionRelatedDisps))
        );

    }
    */

    private prepareSelectionForMove() {
        this._selectionRelatedDisps = [];
        this._selectedPolylineEnds = [];

        let keysBeingMoved = [];

        for (let disp of this.viewArgs.model.selection.selectedDisps()) {
            if (DispBase.typeOf(disp) == DispType.polyline)
                this.prepareSelectionForPolylineMove();
            else
                this.prepareSelectionForNodeMove();
        }
    }

    private prepareSelectionForNodeMove() {

        this._selectionRelatedDisps.add(this.viewArgs.model.query.dispsInSelectedGroups);
        // If we have polylines selected, add the shapes they are connected to as well
        // let dispKeysAtEndsOfPolylines = DispPolyline
        //     .startEndKeys(this.viewArgs.model.selection.selectedDisps());


        this._selectedPolylineEnds.add(this.viewArgs.model.query
            .polylinesConnectedToDispKey(DispBase.keys(this._selectionRelatedDisps))
        );
    }

    private prepareSelectionForPolylineMove() {

        // // Select all the other polyline ends being moved
        // let keysBeingMoved = DispBase.keys(this._selectedDisps);
        // keysBeingMoved.add(dispKeysAtEndsOfPolylines);
        // this._selectedPolylineEnds = this.viewArgs.model.query
        //     .polylinesConnectedToDispKey(keysBeingMoved);
        //
        //
        // let dispsBeingMovedByKey = this.viewArgs.model.query.dispsForKeys(keysBeingMoved);
        // this._selectedDisps.add(
        //     this.viewArgs.model.query.dispsForGroups(dispsBeingMovedByKey)
        // )

    };

    /** Add Disps To Branch For Update
     *
     * For all the selected items, add them to the branch so we can use them for
     * an update.
     *
     * @param inputPos: The position of the input, used to create anchor points
     */
    private addDispsToBranchForUpdate(inputPos: CanvasInputPos) {
        let primarySelections = this.viewArgs.model.selection.selectedDisps();
        let groupSelections = this.viewArgs.model.query.dispsInSelectedGroups;

        primarySelections = this.canvasEditor.branchContext.branchTuple
            .addOrUpdateDisps(primarySelections, true);

        groupSelections = this.canvasEditor.branchContext.branchTuple
            .addOrUpdateDisps(groupSelections, true);

        for (let dispPolylineEnd of this._selectedPolylineEnds) {
            dispPolylineEnd.polylineDisp = this.canvasEditor
                .branchContext
                .branchTuple
                .addOrUpdateDisp(dispPolylineEnd.polylineDisp, true);
        }

        this.viewArgs.model.recompileModel();
        this.viewArgs.model.selection.replaceSelection(primarySelections);
        this._selectionRelatedDisps = groupSelections;

        this._addBranchAnchor(inputPos.x, inputPos.y);
    }


    // ------------------------------------------------------------------------
    // Methods moving the selection

    private deltaMoveSelection(delta: CanvasInputDeltaI): void {

        // If we're moving a handle, and it's not the end of a polyline,
        // Then move the handle
        let h = this._mouseDownOnHandle;
        if (!DispPolyline.isStartHandle(h.disp, h.handleIndex)
            && !DispPolyline.isEndHandle(h.disp, h.handleIndex))
            this.deltaMoveHandle(h, delta);


        // Move all of the shapes that are moved in full
        for (let disp of this._selectionRelatedDisps) {
            DispBase.deltaMove(disp, delta.dx, delta.dy);
        }

        // Move all of the connected polyline ends
        for (let dispPolylineEnd of this._selectedPolylineEnds) {
            if (dispPolylineEnd.isStart) {
                DispPolyline
                    .deltaMoveStart(dispPolylineEnd.polylineDisp, delta.dx, delta.dy);
            } else {
                DispPolyline
                    .deltaMoveEnd(dispPolylineEnd.polylineDisp, delta.dx, delta.dy);
            }
        }

        this.canvasEditor.branchContext.branchTuple.touchUpdateDate(false);
        this.viewArgs.config.invalidate();
    }

    /** Delta Move Handle
     *
     * This method is used to move all handles, EXCEPT Polyline ends
     */
    private deltaMoveHandle(handle: HandleI, delta: CanvasInputDeltaI): void {
        DispFactory.wrapper(handle.disp).deltaMoveHandle(
            handle.disp, handle.handleIndex, delta.dx, delta.dy
        );

        this.canvasEditor.branchContext.branchTuple.touchUpdateDate(false);
        this.viewArgs.config.invalidate();
    }
}