// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */

define("PeekCanvasMouseSelectDelegate", [
            // Named Dependencies
            "peek_plugin_diagram/_private/both-app/canvas/PeekCanvasMouseDelegate"
            // Unnamed Dependencies
        ],
        function (PeekCanvasMouseDelegate) {
//Normal Inheritance 
            PeekCanvasMouseSelectDelegate.prototype = new PeekCanvasMouseDelegate();
            PeekCanvasMouseSelectDelegate.prototype.constructor = PeekCanvasMouseSelectDelegate;
            PeekCanvasMouseSelectDelegate.prototype.parent = PeekCanvasMouseDelegate.prototype;
            PeekCanvasMouseSelectDelegate.NAME = "SELECT";

            function PeekCanvasMouseSelectDelegate(canvasMouse, config, model, dispDelegate) {
                var self = this;

                self._canvasMouse = canvasMouse;
                self.config = config;
                self.model = model;
                self.dispDelegate = dispDelegate;

                // CONSTANTS
                self.STATE_NONE = 0;
                self.STATE_SELECTING = 1;
                self.STATE_DRAG_SELECTING = 2;
                self.STATE_MOVING_RENDERABLE = 3;
                self.STATE_MOVING_HANDLE = 4;
                self.STATE_CANVAS_PANNING = 5;
                self.STATE_CANVAS_ZOOMING = 6;

                self._state = self.STATE_NONE;
                self._passedDragThreshold = false;
                self._mouseDownOnSelection = false;
                self._mouseDownOnCoord = false;
                self._mouseDownWithShift = false;
                self._mouseDownWithCtrl = false;
                self._mouseDownMiddleButton = false;
                self._mouseDownRightButton = false;
                self._mouseDownOnHandle = null;

                // See mousedown and mousemove events for explanation
                self._startMousePos = null;
                self._lastMousePos = null;

                self._reset();
            }

            PeekCanvasMouseSelectDelegate.prototype._reset = function () {
                var self = this;

                // **** Keep track of state! ****
                self._state = self.STATE_NONE;
                self._passedDragThreshold = false;
                self._mouseDownOnSelection = false;
                self._mouseDownOnCoord = false;
                self._mouseDownWithShift = false;
                self._mouseDownWithCtrl = false;
                self._mouseDownMiddleButton = false;
                self._mouseDownRightButton = false;
                self._mouseDownOnHandle = null;

                self._lastPinchDist = null;

                // See mousedown and mousemove events for explanation
                self._startMousePos = null;
                self._lastMousePos = null;
            };

            PeekCanvasMouseSelectDelegate.prototype.keyUp = function (event) {
                var self = this;

                // var charCode = (typeof event.which == "number") ? event.which :
                // event.keyCode;
                // alert(charCode + "| pressed");
                var phUpDownZoomFactor = self.config.mouse.phUpDownZoomFactor;

                // Delete the coord on the canvas
                if (event.keyCode == 46) {
                    var coords = self.model.selectedDisps();
                    self.model.deleteDisp(coords);
                    self.model.clearSelection();

                } else if (event.keyCode == 33) { // Page UP
                    editorRenderer.zoom(1.0 + phUpDownZoomFactor / 100.0);

                } else if (event.keyCode == 34) { // Page Down
                    editorRenderer.zoom(1.0 - phUpDownZoomFactor / 100.0);

                } else if (event.keyCode == 67) { // the letter c
                    updateSelectedCoordNodesClosedState(true);


                } else if (event.keyCode == 79) { // the letter o
                    updateSelectedCoordNodesClosedState(false);

                    // Snap selected objects to grid
                    //} else if (String.fromCharCode(event.keyCode) == "S") {
                    //    self._snapSelectedCoords();
                }


            };

// fixes a problem where double clicking causes
// text to get selected on the canvas
// PeekCanvasMouseSelectDelegate.prototype.mouseSelectStart = function(event,
// mouse) {
// };

            PeekCanvasMouseSelectDelegate.prototype.touchStart = function (event, mouse) {
                var self = this;

                if (event.targetTouches.length == 2) {
                    self._state = self.STATE_CANVAS_ZOOMING;
                    self.lastPinchDist = null;
                } else {
                    self.mouseDown(event, mouse);
                }
            };

            PeekCanvasMouseSelectDelegate.prototype.mouseDown = function (event, mouse) {
                var self = this;

                self._mouseDownWithShift = event.shiftKey;
                self._mouseDownWithCtrl = event.ctrlKey;
                self._mouseDownMiddleButton = event.button == 1;
                self._mouseDownRightButton = event.button == 2;
                var panTouch = event.targetTouches && event.targetTouches.length == 1;
                self._startMousePos = mouse;
                self._lastMousePos = mouse;

                if (self._mouseDownMiddleButton || self._mouseDownRightButton || panTouch) {
                    self._state = self.STATE_CANVAS_PANNING;
                    return;
                }

                var selectedDisps = self.model.selectedDisps();


                for (var i = selectedDisps.length - 1; i >= 0; i--) {
                    var coord = selectedDisps[i];
                    var handles = self.dispDelegate.handles(coord);
                    for (var j = 0; j < handles.length; j++) {
                        var handle = handles[j];
                        if (handle.contains(mouse.x, mouse.y)) {
                            self._mouseDownOnHandle = {
                                coord: coord,
                                handle: handle,
                                handleIndex: j
                            };
                            break;
                        }
                    }
                }

                var margin = self.config.mouse.selecting.margin;// * self.config.canvas.zoom;

                for (var i = selectedDisps.length - 1; i >= 0; i--) {
                    var r = selectedDisps[i];
                    if (self.dispDelegate.contains(r, mouse.x, mouse.y, margin)) {
                        self._mouseDownOnSelection = true;
                        break;
                    }
                }

                if (self._mouseDownOnSelection) {
                    self._mouseDownOnCoord = true;
                } else {
                    var disps = self.model.selectableDisps();
                    for (var i = disps.length - 1; i >= 0; i--) {
                        var r = disps[i];
                        if (self.dispDelegate.contains(r, mouse.x, mouse.y, margin)) {
                            self._mouseDownOnCoord = true;
                            break;
                        }
                    }
                }

                if (self._mouseDownOnCoord) {
                    self._state = self.STATE_SELECTING;
                } else {
                    self._state = self.STATE_CANVAS_PANNING;
                    self.model.clearSelection();
                }


                /*
                 if (self._mouseDownOnHandle != null) {
                 self._state = self.STATE_MOVING_HANDLE;
                 }else {
                 self._state = self.STATE_SELECTING;
                 }
                 */


            };

            PeekCanvasMouseSelectDelegate.prototype.touchMove = function (event, mouse) {
                var self = this;
                if (self._state == self.STATE_CANVAS_ZOOMING) {
                    self._touchZoom(event, mouse);

                } else {
                    self.mouseMove(event, mouse);

                }

                event.preventDefault();
            };

            PeekCanvasMouseSelectDelegate.prototype._touchZoom = function (event, mouse) {
                var self = this;

                var t1x = event.targetTouches[0].pageX;
                var t1y = event.targetTouches[0].pageY;
                var t2x = event.targetTouches[1].pageX;
                var t2y = event.targetTouches[1].pageY;

                // Get the center coordinate, Average
                var center = {
                    clientX: mouse.clientX,
                    clientY: mouse.clientY
                };
                console.log(center);

                var dist = Math.sqrt(
                        (t1x - t2x) * (t1x - t2x) +
                        (t1y - t2y) * (t1y - t2y)
                );

                if (self._lastPinchDist == null) {

                    self._lastPinchDist = dist;
                    return;
                }

                var delta = self._lastPinchDist - dist;
                self._lastPinchDist = dist;

                // Begin applying zoom / pan
                self._zoomPan(center.clientX, center.clientY, delta)


            };

            PeekCanvasMouseSelectDelegate.prototype._zoomPan
                    = function (clientX, clientY, delta) {
                var self = this;

                if (!delta) {
                    return;
                }

                delta = delta * -1; // Correct the zooming to match google maps, etc

                // begin
                var zoom = self.config.canvas.zoom;
                var pan = self.config.canvas.pan;

                // Capture the initial canvas relative position
                var panStart = {
                    x: clientX / zoom + pan.x,
                    y: clientY / zoom + pan.y
                };

                // Apply Zoom Delta
                zoom *= (1.0 + delta / 100.0);

                // If the zoom won't apply just exit
                if (!(self.config.canvas.minZoom < zoom
                        && zoom < self.config.canvas.maxZoom)) {
                    return;
                }

                // Capture the final canvas relative position
                var panEnd = {
                    x: clientX / zoom + pan.x,
                    y: clientY / zoom + pan.y
                };

                // Update values in canvas
                self.config.canvas.zoom = zoom;
                self.config.canvas.pan.x += (panStart.x - panEnd.x);
                self.config.canvas.pan.y += (panStart.y - panEnd.y);

                // Iterate the angular processor
                self._canvasMouse.applyUpdates();
            };

            PeekCanvasMouseSelectDelegate.prototype.mouseMove = function (event, mouse) {
                var self = this;

                if (self._state == self.STATE_NONE)
                    return;

                self._passedDragThreshold |= self._hasPassedDragThreshold(
                        self._startMousePos, mouse);

                // State conversion upon dragging
                if (self._state == self.STATE_SELECTING && self._passedDragThreshold) {
                    if (self._mouseDownOnSelection) {
                        self._state = self.STATE_MOVING_RENDERABLE;

                    } else if (self._mouseDownOnCoord) {
                        self._changeSelection(self._selectByPoint(self._startMousePos));
                        self._state = self.STATE_MOVING_RENDERABLE;

                    } else {
                        self._state = self.STATE_DRAG_SELECTING;

                    }
                }

                switch (self._state) {

                    case self.STATE_CANVAS_PANNING:
                        var delta = self._setLastMousePos(mouse);
                        // Dragging the mouse left makes a negative delta, we increase X
                        // Dragging the mouse up makes a negative delta, we increase Y
                        self.config.canvas.pan.x -= delta.dClientX / self.config.canvas.zoom;
                        self.config.canvas.pan.y -= delta.dClientY / self.config.canvas.zoom;
                        self._canvasMouse.applyUpdates();
                        break;

                    case self.STATE_DRAG_SELECTING:
                        self._lastMousePos = mouse;
                        break;

                    case self.STATE_MOVING_RENDERABLE:

                        var selectedCoords = self.model.selectedDisps();


                        //if (selectedCoords.length == 1 && editorUi.grid.snapping()) {
                        //    var snapSize = editorUi.grid.snapSize();
                        //    // If any changes were made, then just skip self mouseMove
                        //    if (selectedCoords[0].snap(snapSize).deltaApplied)
                        //        break;
                        //}

                        var delta = self._setLastMousePos(mouse);

                        for (var i = selectedCoords.length - 1; i >= 0; --i) {
                            self.dispDelegate.deltaMove(selectedCoords[i], delta.dx, delta.dy);
                        }

                        if (selectedCoords.length != 0) {
                            self._canvasMouse.applyUpdates();
                            break;
                        }

                    case
                    self.STATE_MOVING_HANDLE        :
                        // if (!self._passedDragThreshold)
                        // break;


                        //var coord = self.model.selectedDisps()[0];

                        //if (editorUi.grid.snapping()) {
                        //    var snapSize = editorUi.grid.snapSize();
                        //    var snapDelta = coord.snap(snapSize);
                        //    // If any changes were made, then just skip self mouseMove
                        //    if (snapDelta.deltaApplied)
                        //        break;
                        //}

                        var delta = self._setLastMousePos(mouse);

                        var h = self._mouseDownOnHandle;

                        assert(h != null, "selected handler is null");
                        h.coord.deltaMoveHandle(delta.dx, delta.dy, h.handle, h.handleIndex);

                        break;

                }

                self._canvasMouse.applyUpdates();
            };

            PeekCanvasMouseSelectDelegate.prototype.touchEnd = function (event, mouse) {
                var self = this;
                self.mouseUp(event, mouse);

            };

            PeekCanvasMouseSelectDelegate.prototype.mouseUp = function (event, mouse) {
                var self = this;

                // Store the change
                switch (self._state) {
                    case self.STATE_SELECTING:
                    case self.STATE_DRAG_SELECTING:

                        var hits = [];
                        if (self._state == self.STATE_SELECTING)
                            hits = self._selectByPoint(self._startMousePos);
                        else if (self._state == self.STATE_DRAG_SELECTING)
                            hits = self._selectByBox(self._startMousePos, mouse);
                        else
                            assert(false, "Invalid state");

                        self._changeSelection(hits);
                        break;

                    case self.STATE_MOVING_RENDERABLE:
                    case self.STATE_MOVING_HANDLE:
                        var selectedCoords = self.model.selectedDisps();
                        for (var i = selectedCoords.length - 1; i >= 0; i--) {
                            console.log("TODO, Store node move states");
                            // selectedCoords[i].storeState();
                        }

                        // TODO, Not a nice structure this is a hack
                        // We need a proper structure

                        console.log("TODO, self._canvasMouse._notifyOfChange");
                        // self._canvasMouse._notifyOfChange(selectedCoords);
                        break;
                }

                self._reset();
                self._canvasMouse.applyUpdates();
            };

            PeekCanvasMouseSelectDelegate.prototype.mouseDoubleClick = function (event, mouse) {
                var self = this;

                var hits = self._selectByTypeAndBounds(mouse);
                self.model.addSelection(hits);
            };

            PeekCanvasMouseSelectDelegate.prototype.mouseWheel = function (event, mouse) {
                var self = this;
                var delta = event.deltaY || event.wheelDelta;

                // Overcome windows zoom multipliers
                if (15 < delta)
                    delta = 15;

                if (delta < -15)
                    delta = -15;

                self._zoomPan(mouse.clientX, mouse.clientY, delta);
            };

            PeekCanvasMouseSelectDelegate.prototype.draw = function (ctx) {
                var self = this;

                switch (self._state) {
                    case self.STATE_DRAG_SELECTING:
                        var zoom = self.config.canvas.zoom;
                        var x = self._startMousePos.x;
                        var y = self._startMousePos.y;
                        var w = self._lastMousePos.x - self._startMousePos.x;
                        var h = self._lastMousePos.y - self._startMousePos.y;

                        ctx.strokeStyle = self.config.mouse.selection.color;
                        ctx.lineWidth = self.config.mouse.selection.width / zoom;
                        ctx.dashedRect(x, y, w, h, self.config.mouse.selection.dashLen / zoom);
                        ctx.stroke();
                        break;

                    case self.STATE_NONE:
                        break;
                }
            };

            PeekCanvasMouseSelectDelegate.prototype._selectByPoint = function (mouse) {
                var self = this;

                var margin = self.config.mouse.selecting.margin;//* self.config.canvas.zoom;

                var coords = self.model.selectableDisps();
                var hits = coords.filter(function (i) {
                    return self.dispDelegate.contains(i, mouse.x, mouse.y, margin);
                }, this);

                // Sort by size, largest to smallest.
                // This ensures we can select smaller items when required.
                hits.sort(self.dispDelegate.selectionPriotityCompare);

                // Only select
                if (!self._mouseDownWithCtrl && hits.length)
                    hits = [hits[hits.length - 1]];

                return hits;
            };

            PeekCanvasMouseSelectDelegate.prototype._selectByBox = function (mouse1, mouse2) {
                var self = this;

                var coords = self.model.selectableDisps();

                var b = Bounds.fromGeom([mouse1, mouse2]);

                return coords.filter(function (i) {
                    return self.dispDelegate.withIn(i, b.x, b.y, b.w, b.h);
                });
            };

            PeekCanvasMouseSelectDelegate.prototype._selectByTypeAndBounds = function (mouse) {
                var self = this;

                var hits = self._selectByPoint(mouse);
                if (!hits.length)
                    return [];

                var masterCoord = hits[hits.length - 1];
                var coords = self.model.selectableDisps();

                return coords.filter(function (i) {
                    return self.dispDelegate.similarTo(i, masterCoord);
                });
            };

            PeekCanvasMouseSelectDelegate.prototype._changeSelection = function (hits) {
                var self = this;

                // Remove clicked on thing
                if (self._mouseDownOnSelection && self._mouseDownWithShift) {
                    self.model.removeSelection(hits);

                } else {
                    if (!self._mouseDownWithShift)
                    // Remove all previous selection
                        self.model.clearSelection();

                    // // Selecting more
                    // self.model.clearSelection();

                    self.model.addSelection(hits);
                }

            };

            //PeekCanvasMouseSelectDelegate.prototype._snapSelectedCoords = function () {
            //    var self = this;
            //
            //    /**
            //     * Snap Selected Coords
            //     *
            //     * Applies the current grid to all the selected coords
            //     */
            //    var snapSize = editorUi.grid.snapSize();
            //    var selectedCoords = self.model.selectedDisps();
            //    for (var i = selectedCoords.length - 1; i >= 0; i--) {
            //        var coord = selectedCoords[i];
            //        if (coord.snap(snapSize).deltaApplied) {
            //            coord.storeState();
            //        }
            //    }
            //
            //    // TODO, Not a nice structure this is a hack
            //    // We need a proper structure
            //    self._canvasMouse._notifyOfChange(selectedCoords);
            //    editorRenderer.invalidate();
            //};

            return PeekCanvasMouseSelectDelegate;
        }
);