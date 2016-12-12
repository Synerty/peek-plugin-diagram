// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
define("PeekCanvasMouse", [
            // Named Dependencies
            // Unnamed Dependencies
        ],
        function () {
            function PeekCanvasMouse($scope, config, model, dispDelegate) {
                var self = this;
                self.scope = $scope;
                self.config = config;
                self.model = model;
                self.dispDelegate = dispDelegate;

                self._delegate = null;
                self.delegateFinished();
            }


            PeekCanvasMouse.prototype.setDelegate = function (Delegate) {
                var self = this;

                if (self._delegate)
                    self._delegate.delegateWillBeTornDown();


                self._delegate = new Delegate(this, self.config, self.model, self.dispDelegate);
                self.config.mouse.currentDelegateName = self._delegate.NAME;
            };

            PeekCanvasMouse.prototype.applyUpdates = function () {
                var self = this;
                self.config.renderer.invalidate = true;
                self.scope.$apply();
            };

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
            PeekCanvasMouse.prototype.delegateFinished = function () {
                var self = this;
                var PeekCanvasMouseSelectDelegate =
                        requirejs("PeekCanvasMouseSelectDelegate");
                self.setDelegate(PeekCanvasMouseSelectDelegate);
            };

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
            PeekCanvasMouse.prototype._getMouse = function (e) {
                var self = this;

                var element = self.canvas;
                var offsetX = 0;
                var offsetY = 0;

                // Compute the total offset
                if (element.offsetParent !== undefined) {
                    do {
                        offsetX += element.offsetLeft;
                        offsetY += element.offsetTop;
                    } while ((element = element.offsetParent));
                }

                // Add padding and border style widths to offset
                // Also add the <html> offsets in case there's a position:fixed bar
                offsetX += self.stylePaddingLeft + self.styleBorderLeft
                        + self.htmlLeft + self.width / 2;
                offsetY += self.stylePaddingTop + self.styleBorderTop
                        + self.htmlTop + self.height / 2;

                var pageX = e.pageX;
                var pageY = e.pageY;

                if (pageX == null) {
                    if (event.changedTouches != null && event.changedTouches.length >= 0) {
                        var touch = event.changedTouches[0];
                        pageX = touch.pageX;
                        pageY = touch.pageY;
                    } else {
                        logWarning("Failed to determine pan coordinates");
                    }
                }

                var mx = pageX - offsetX;
                var my = pageY - offsetY;

                var clientX = mx;
                var clientY = my;

                // Apply canvas scale and pan
                var zoom = self.config.canvas.zoom;
                var pan = self.config.canvas.pan;
                mx = mx / zoom + pan.x;
                my = my / zoom + pan.y;

                if (isNaN(mx))
                    console.log("mx IS NaN");


                self.config.mouse.currentPosition = {x: mx, y: my};

                // We return a simple javascript object (a hash) with x and y defined
                return {
                    x: mx,
                    y: my,
                    clientX: clientX,
                    clientY: clientY,
                    time: new Date()
                };
            };

            PeekCanvasMouse.prototype.setCanvas = function (canvas) {
                var self = this;

                self.canvas = canvas;

                canvas.addEventListener('keydown', function (e) {
                    self._delegate.keyDown(e);
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('keypress', function (e) {
                    self._delegate.keyPress(e);
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('keyup', function (e) {
                    self._delegate.keyUp(e);
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('mousedown', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.mouseDown(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('mousemove', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.mouseMove(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('mouseup', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.mouseUp(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('mousewheel', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.mouseWheel(e, self._getMouse(e));
                    self.scope.$apply();
                    e.preventDefault();
                    return false;
                }, true);

                canvas.addEventListener('dblclick', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.mouseDoubleClick(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('selectstart', function (e) {
                    //this_._delegate.mouseSelectStart(e, this_._getMouse(e));
                    e.preventDefault();
                    return false;
                }, true);

                canvas.addEventListener('contextmenu', disableContextMenu, true);

                canvas.addEventListener('touchstart', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.touchStart(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('touchmove', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.touchMove(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                canvas.addEventListener('touchend', function (e) {
                    if (!e instanceof MouseEvent) return;
                    self._delegate.touchEnd(e, self._getMouse(e));
                    self.scope.$apply();
                }, true);

                // Watch the size of the canvas, update if it changes
                self.scope.$watch(function () {
                    var jq = $(self.canvas);
                    var offset = jq.offset();
                    return jq.width().toString()
                            + "x" + jq.height().toString()
                            + "x" + offset.left.toString()
                            + "x" + offset.top.toString()
                            ;

                }, function () {
                    self.updateCanvasSize();
                });
            };

            PeekCanvasMouse.prototype.updateCanvasSize = function () {
                var self = this;
                var jqCanvas = $(self.canvas);


                self.width = jqCanvas.width();
                self.height = jqCanvas.height();


                // This complicates things a little but but fixes mouse co-ordinate
                // problems
                // when there's a border or padding. See getMouse for more detail
                self.stylePaddingLeft = parseInt(jqCanvas.css('padding-left')) || 0;
                self.stylePaddingTop = parseInt(jqCanvas.css('padding-top')) || 0;
                self.styleBorderLeft = parseInt(jqCanvas.css('border-left-width')) || 0;
                self.styleBorderTop = parseInt(jqCanvas.css('border-top-width')) || 0;

                //if (document.defaultView && document.defaultView.getComputedStyle) {
                //    self.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(
                //                    self.canvas, null)['paddingLeft'], 10) || 0;
                //    self.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(
                //                    self.canvas, null)['paddingTop'], 10) || 0;
                //    self.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(
                //                    self.canvas, null)['borderLeftWidth'], 10) || 0;
                //    self.styleBorderTop = parseInt(document.defaultView.getComputedStyle(
                //                    self.canvas, null)['borderTopWidth'], 10) || 0;
                //}

                // Some pages have fixed-position bars (like the stumbleupon bar) at the
                // top or left of the page
                // They will mess up mouse coordinates and this fixes that
                var html = document.body.parentNode;
                self.htmlTop = html.offsetTop;
                self.htmlLeft = html.offsetLeft;

            };

            /**
             * Draw Called by the renderer during a redraw.
             */
            PeekCanvasMouse.prototype.draw = function (ctx) {
                var self = this;

                if (self._delegate)
                    self._delegate.draw(ctx);
            };

            return PeekCanvasMouse;
        }
);