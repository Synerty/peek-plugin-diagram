// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
//Normal Inheritance 
CanvasMouseSelectDelegate.prototype = new CanvasMouseDelegate();
CanvasMouseSelectDelegate.prototype.constructor = CanvasMouseSelectDelegate;
CanvasMouseSelectDelegate.prototype.parent = CanvasMouseDelegate.prototype;

function CanvasMouseSelectDelegate(canvasMouse) {
    this._canvasMouse = canvasMouse;

    // CONSTANTS
    this.STATE_NONE = 0;
    this.STATE_SELECTING = 1;
    this.STATE_DRAG_SELECTING = 2;
    this.STATE_MOVING_RENDERABLE = 3;
    this.STATE_MOVING_HANDLE = 4;
    this.STATE_CANVAS_PANNING = 5;

    this._CONTAINS_CHECK_MARGIN = 3;

    this._state = this.STATE_NONE;
    this._passedDragThreshold = false;
    this._mouseDownOnSelection = false;
    this._mouseDownOnRenderable = false;
    this._mouseDownWithShift = false;
    this._mouseDownWithCtrl = false;
    this._mouseDownMiddleButton = false;
    this._mouseDownRightButton = false;
    this._mouseDownOnHandle = null;

    // See mousedown and mousemove events for explanation
    this._startMousePos = null;
    this._lastMousePos = null;

    this._reset();
}

CanvasMouseSelectDelegate.prototype._reset = function () {
    // **** Keep track of state! ****
    this._state = this.STATE_NONE;
    this._passedDragThreshold = false;
    this._mouseDownOnSelection = false;
    this._mouseDownOnRenderable = false;
    this._mouseDownWithShift = false;
    this._mouseDownWithCtrl = false;
    this._mouseDownMiddleButton = false;
    this._mouseDownRightButton = false;
    this._mouseDownOnHandle = null;

    // See mousedown and mousemove events for explanation
    this._startMousePos = null;
    this._lastMousePos = null;
};

CanvasMouseSelectDelegate.prototype.keyUp = function (event) {
    // var charCode = (typeof event.which == "number") ? event.which :
    // event.keyCode;
    // alert(charCode + "| pressed");
    var phUpDownZoomFactor = 20.0;

    // Delete the renderable on the canvas
    if (event.keyCode == 46) {
        var renderables = editorModel.selectedRenderables();
        editorModel.deleteRenderable(renderables);
        editorModel.clearSelection();

    } else if (event.keyCode == 33) { // Page UP
        editorRenderer.zoom(1.0 + phUpDownZoomFactor / 100.0);

    } else if (event.keyCode == 34) { // Page Down
        editorRenderer.zoom(1.0 - phUpDownZoomFactor / 100.0);

    } else if (event.keyCode == 67) { // the letter c
        updateSelectedRenderableNodesClosedState(true);


    } else if (event.keyCode == 79) { // the letter o
        updateSelectedRenderableNodesClosedState(false);

        // Snap selected objects to grid
    } else if (String.fromCharCode(event.keyCode) == "S") {
        this._snapSelectedRenderables();
    }


};

// fixes a problem where double clicking causes
// text to get selected on the canvas
// CanvasMouseSelectDelegate.prototype.mouseSelectStart = function(event,
// mouse) {
// };

CanvasMouseSelectDelegate.prototype.mouseDown = function (event, mouse) {

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

    var selectedRenderables = editorModel.selectedRenderables();


    for (var i = selectedRenderables.length - 1; i >= 0; i--) {
        var renderable = selectedRenderables[i];
        var handles = renderable.handles();
        for (var j = 0; j < handles.length; j++) {
            var handle = handles[j];
            if (handle.contains(mouse.x, mouse.y)) {
                this._mouseDownOnHandle = {
                    renderable: renderable,
                    handle: handle,
                    handleIndex: j
                };
                break;
            }
        }
    }


    for (var i = selectedRenderables.length - 1; i >= 0; i--) {
        if (selectedRenderables[i].contains(mouse.x, mouse.y,
                        this._CONTAINS_CHECK_MARGIN)) {
            this._mouseDownOnSelection = true;
            break;
        }
    }

    if (this._mouseDownOnSelection) {
        this._mouseDownOnRenderable = true;
    } else {
        var renderables = editorModel.renderablesAvailibleForSelection();
        for (var i = renderables.length - 1; i >= 0; i--) {
            var r = renderables[i];
            if (r.contains(mouse.x, mouse.y, this._CONTAINS_CHECK_MARGIN)) {
                this._mouseDownOnRenderable = true;
                break;
            }
        }
    }

    if (this._mouseDownOnHandle != null)
        this._state = this.STATE_MOVING_HANDLE;
    else
        this._state = this.STATE_SELECTING;


};

CanvasMouseSelectDelegate.prototype.mouseMove = function (event, mouse) {
    var self = this;

    if (self._state == self.STATE_NONE)
        return;

    self._passedDragThreshold |= self._hasPassedDragThreshold(
            self._startMousePos, mouse);

    // State conversion upon dragging
    if (self._state == self.STATE_SELECTING && self._passedDragThreshold) {
        if (self._mouseDownOnSelection) {
            self._state = self.STATE_MOVING_RENDERABLE;

        } else if (self._mouseDownOnRenderable) {
            self._changeSelection(self._selectByPoint(self._startMousePos));
            self._state = self.STATE_MOVING_RENDERABLE;

        } else {
            self._state = self.STATE_DRAG_SELECTING;

        }
    }

    switch (self._state) {

        case self.STATE_CANVAS_PANNING:
            var delta = self._setLastMousePos(mouse);
            var zoom = editorRenderer._zoomLevel;
            editorRenderer.pan(delta.dClientX / zoom, delta.dClientY / zoom);
            break;

        case self.STATE_DRAG_SELECTING:
            self._lastMousePos = mouse;
            break;

        case self.STATE_MOVING_RENDERABLE:

            var selectedRenderables = editorModel.selectedRenderables();


            //if (selectedRenderables.length == 1 && editorUi.grid.snapping()) {
            //    var snapSize = editorUi.grid.snapSize();
            //    // If any changes were made, then just skip self mouseMove
            //    if (selectedRenderables[0].snap(snapSize).deltaApplied)
            //        break;
            //}

            var delta = self._setLastMousePos(mouse);

            for (var i = selectedRenderables.length - 1; i >= 0; --i) {
                selectedRenderables[i].deltaMove(delta.dx, delta.dy);
            }

            if (selectedRenderables.length != 0)
                editorRenderer.invalidate();
            break;

        case self.STATE_MOVING_HANDLE:
            // if (!self._passedDragThreshold)
            // break;


            //var renderable = editorModel.selectedRenderables()[0];

            //if (editorUi.grid.snapping()) {
            //    var snapSize = editorUi.grid.snapSize();
            //    var snapDelta = renderable.snap(snapSize);
            //    // If any changes were made, then just skip self mouseMove
            //    if (snapDelta.deltaApplied)
            //        break;
            //}

            var delta = self._setLastMousePos(mouse);

            var h = self._mouseDownOnHandle;

            assert(h != null, "selected handler is null");
            h.renderable.deltaMoveHandle(delta.dx, delta.dy, h.handle, h.handleIndex);

            break;

    }

    editorRenderer.invalidate();
};

CanvasMouseSelectDelegate.prototype.mouseUp = function (event, mouse) {
    // Store the change
    switch (this._state) {
        case this.STATE_SELECTING:
        case this.STATE_DRAG_SELECTING:

            var hits = [];
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
            var selectedRenderables = editorModel.selectedRenderables();
            for (var i = selectedRenderables.length - 1; i >= 0; i--) {
                selectedRenderables[i].storeState();
            }

            // TODO, Not a nice structure this is a hack
            // We need a proper structure
            this._canvasMouse._notifyOfChange(selectedRenderables);
            break;
    }

    this._reset();
    editorRenderer.invalidate();
};

CanvasMouseSelectDelegate.prototype.mouseDoubleClick = function (event,
                                                                       mouse) {
    var hits = this._selectByTypeAndBounds(mouse);
    editorModel.clearSelection();
    editorModel.addSelection(hits);
};

CanvasMouseSelectDelegate.prototype.mouseWheel = function (event, mouse) {
    if (!event.deltaY) return;

    editorRenderer.zoom(1.0 + event.deltaY / 100.0);
};

CanvasMouseSelectDelegate.prototype.draw = function (ctx) {
    switch (this._state) {
        case this.STATE_DRAG_SELECTING:
            var x = this._startMousePos.x;
            var y = this._startMousePos.y;
            var w = this._lastMousePos.x - this._startMousePos.x;
            var h = this._lastMousePos.y - this._startMousePos.y;

            ctx.dashedRect(x, y, w, h, CanvasRenderer.SELECTION_DASH_LEN);
            ctx.strokeStyle = CanvasRenderer.SELECTION_COLOR;
            ctx.lineWidth = CanvasRenderer.SELECTION_WIDTH;
            ctx.stroke();
            break;

        case this.STATE_NONE:
            break;
    }
};

CanvasMouseSelectDelegate.prototype._selectByPoint = function (mouse) {
    var renderables = editorModel.renderablesAvailibleForSelection();
    var hits = renderables.filter(function (i) {
        return i.contains(mouse.x, mouse.y, this._CONTAINS_CHECK_MARGIN);
    }, this);
    // Only select
    if (!this._mouseDownWithCtrl && hits.length)
        hits = [hits[hits.length - 1]];

    return hits;
}

CanvasMouseSelectDelegate.prototype._selectByBox = function (mouse1,
                                                                   mouse2) {
    var renderables = editorModel.renderablesAvailibleForSelection();

    var b = Bounds.fromPoints(mouse1, mouse2);

    return renderables.filter(function (i) {
        return i.withIn(b.x, b.y, b.w, b.h);
    });
};

CanvasMouseSelectDelegate.prototype._selectByTypeAndBounds = function (mouse) {
    var hits = this._selectByPoint(mouse);
    if (!hits.length)
        return [];

    var masterRenderable = hits[hits.length - 1];
    var renderables = editorModel.renderablesAvailibleForSelection();

    return renderables.filter(function (i) {
        return i.similarTo(masterRenderable);
    });
};

CanvasMouseSelectDelegate.prototype._changeSelection = function (hits) {
    // Remove clicked on thing
    if (this._mouseDownOnSelection && this._mouseDownWithShift)
        editorModel.removeSelection(hits);

    else {
        if (!this._mouseDownWithShift)
        // Remove all previous selection
            editorModel.clearSelection();

        // Selecting more
        editorModel.addSelection(hits);
    }

};

CanvasMouseSelectDelegate.prototype._snapSelectedRenderables = function () {
    /**
     * Snap Selected Renderables
     *
     * Applies the current grid to all the selected renderables
     */
    var snapSize = editorUi.grid.snapSize();
    var selectedRenderables = editorModel.selectedRenderables();
    for (var i = selectedRenderables.length - 1; i >= 0; i--) {
        var renderable = selectedRenderables[i];
        if (renderable.snap(snapSize).deltaApplied) {
            renderable.storeState();
        }
    }

    // TODO, Not a nice structure this is a hack
    // We need a proper structure
    this._canvasMouse._notifyOfChange(selectedRenderables);
    editorRenderer.invalidate();
};
