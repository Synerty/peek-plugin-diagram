import {
    CanvasInputPos,
    InputDelegateConstructorViewArgs,
    PeekCanvasInputDelegate
} from "./PeekCanvasInputDelegate.web";
import * as assert from "assert";
import {EditorToolType} from "../canvas/PeekCanvasEditorToolType.web";
import {DispBase, DispBaseT, PointI} from "../canvas-shapes/DispBase";
import {DrawModeE} from "../canvas-render/PeekDispRenderDelegateABC.web";
import {InputDelegateConstructorEditArgs} from "./PeekCanvasInputDelegateUtil.web";
import {diagramPluginName} from "@peek/peek_plugin_diagram/_private/PluginNames";
import {DocDbPopupTypeE} from "@peek/peek_plugin_docdb";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputSelectDelegate extends PeekCanvasInputDelegate {
    static readonly TOOL_NAME = EditorToolType.SELECT_TOOL;

    // CONSTANTS
    STATE_NONE = 0;
    STATE_SELECTING = 1;
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
    _startMousePos: CanvasInputPos | null = null;

    // This is the disp that is shown when you hover over it.
    private suggestedDispToSelect: DispBaseT | null = null;

    constructor(viewArgs: InputDelegateConstructorViewArgs,
                editArgs: InputDelegateConstructorEditArgs) {
        super(viewArgs, editArgs, PeekCanvasInputSelectDelegate.TOOL_NAME);

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

        this.suggestedDispToSelect = null;

        this._lastPinchDist = null;

        // See mousedown and mousemove events for explanation
        this._startMousePos = null;
        this._lastMousePos = null;
    };

    keyUp(event) {

        let phUpDownZoomFactor = this.viewArgs.config.mouse.phUpDownZoomFactor;

        if (event.keyCode == 33) { // Page UP
            let zoom = this.viewArgs.config.viewPort.zoom;
            zoom *= (1.0 + phUpDownZoomFactor / 100.0);
            this.viewArgs.config.updateViewPortZoom(zoom);

        } else if (event.keyCode == 34) { // Page Down
            let zoom = this.viewArgs.config.viewPort.zoom;
            zoom *= (1.0 - phUpDownZoomFactor / 100.0);
            this.viewArgs.config.updateViewPortZoom(zoom);

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

        this.suggestedDispToSelect = null;
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

        let selectedDisps = this.viewArgs.model.selection.selectedDisps();

        let margin = this.viewArgs.config.mouse.selecting.margin;// * this.viewArgs.config.viewPort.zoom;

        for (let i = selectedDisps.length - 1; i >= 0; i--) {
            let d = selectedDisps[i];
            if (d.bounds && d.bounds.contains(mouse.x, mouse.y, margin)) {
                this._mouseDownOnSelection = true;
                break;
            }
        }

        if (this._mouseDownOnSelection) {
            this._mouseDownOnCoord = true;
        } else {
            let disps = this.viewArgs.model.query.selectableDisps;
            for (let i = disps.length - 1; i >= 0; i--) {
                let d = disps[i];
                if (d.bounds && d.bounds.contains(mouse.x, mouse.y, margin)) {
                    this._mouseDownOnCoord = true;
                    break;
                }
            }
        }

        if (this._mouseDownOnCoord) {
            this._state = this.STATE_SELECTING;
        } else {
            this._state = this.STATE_CANVAS_PANNING;
            this._changeSelection([], event);
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

        if (this._state == this.STATE_NONE) {
            this.renderSelectablesUnderMouse(inputPos, event);
            return;
        }

        this._passedDragThreshold = this._passedDragThreshold
            || this._hasPassedDragThreshold(this._startMousePos, inputPos);

        // State conversion upon dragging
        if (this._state == this.STATE_SELECTING && this._passedDragThreshold) {
            this._state = this.STATE_CANVAS_PANNING;
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

        }

        this.viewArgs.config.invalidate()
    };

    touchEnd(event: TouchEvent, mouse) {
        this.mouseUp(event, mouse);

    }

    mouseUp(event, mouse) {


        // Store the change
        switch (this._state) {
            case this.STATE_SELECTING: {

                let hits = [];
                if (this._state == this.STATE_SELECTING)
                    hits = this._selectByPoint(this._startMousePos);
                else
                    assert(false, "Invalid state");

                this._changeSelection(hits, event);
                break;
            }

        }

        this._reset();
        this.viewArgs.config.invalidate()
    };

    mouseDoubleClick(event, mouse) {
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

    draw(ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
        if (this.suggestedDispToSelect != null) {
            this.viewArgs.renderFactory.drawSelected(this.suggestedDispToSelect,
                ctx, zoom, pan, DrawModeE.ForSuggestion);
        }
    };

    private renderSelectablesUnderMouse(inputPos: CanvasInputPos, mouse: MouseEvent): void {
        const q = this.viewArgs.model.query;

        let disps = q.filterForVisibleDisps(q.selectableDisps,
            this.viewArgs.config.viewPort.zoom, true);

        let hits = q.filterForDispsContainingPoint(disps,
            this.viewArgs.config.viewPort.zoom,
            this.viewArgs.config.mouse.selecting.margin,
            inputPos, true);

        // Sort by how close the click is from the center of the box.
        hits = q.sortByDistanceFromCenter(hits, inputPos);


        if (!hits.length)
            return this.clearSelectableUnderMouse();

        // Don't highlight already selected disps
        for (const selDisp of q.selectedDisps) {
            if (DispBase.id(selDisp) == DispBase.id(hits[0]))
                return this.clearSelectableUnderMouse();
        }

        const newHit = hits[0];
        if (this.suggestedDispToSelect != null &&
            DispBase.id(newHit) == DispBase.id(this.suggestedDispToSelect))
            return;

        this.clearSelectableUnderMouse();

        // Show the tooltip
        this.viewArgs.objectPopupService
            .showPopup(
                DocDbPopupTypeE.tooltipPopup,
                diagramPluginName,
                mouse,
                this.viewArgs.config.controller.modelSetKey,
                DispBase.key(newHit),
                {triggeredForContext: this.viewArgs.config.coordSet.key});

        this.suggestedDispToSelect = newHit;
        this.viewArgs.config.invalidate();
    };

    private clearSelectableUnderMouse(): void {
        // Hide the tooltip
        this.viewArgs.objectPopupService.hidePopup(DocDbPopupTypeE.tooltipPopup);

        this.suggestedDispToSelect = null;
        this.viewArgs.config.invalidate();
    }

    _selectByPoint(inputPos: CanvasInputPos) {
        const q = this.viewArgs.model.query;

        let disps = q.filterForVisibleDisps(q.selectableDisps,
            this.viewArgs.config.viewPort.zoom, true);

        let hits = q.filterForDispsContainingPoint(disps,
            this.viewArgs.config.viewPort.zoom,
            this.viewArgs.config.mouse.selecting.margin,
            inputPos, true);

        // Sort by how close the click is from the center of the box.
        hits = q.sortByDistanceFromCenter(hits, inputPos);

        // Only select
        if (!this._mouseDownWithCtrl && hits.length)
            hits = [hits[0]];

        return hits;
    }

    _changeSelection(hits, mouse: MouseEvent) {
        this.clearSelectableUnderMouse();
        this.viewArgs.objectPopupService.hidePopup(DocDbPopupTypeE.summaryPopup);

        // If nothing is selected, clear the selection
        if (hits.length == 0) {
            this.viewArgs.model.selection.clearSelection();

            // Remove clicked on thing
        } else if (this._mouseDownOnSelection && this._mouseDownWithShift) {
            this.viewArgs.model.selection.removeSelection(hits);

        } else {
            if (this._mouseDownWithShift)
                this.viewArgs.model.selection.addSelection(hits);
            else
                this.viewArgs.model.selection.replaceSelection(hits);
        }

        if (hits.length == 1) {
            // Show the tooltip
            this.viewArgs.objectPopupService
                .showPopup(
                    DocDbPopupTypeE.summaryPopup,
                    diagramPluginName,
                    mouse,
                    this.viewArgs.config.controller.modelSetKey,
                    DispBase.key(hits[0]),
                    {triggeredForContext: this.viewArgs.config.coordSet.key});

        }


    }


}