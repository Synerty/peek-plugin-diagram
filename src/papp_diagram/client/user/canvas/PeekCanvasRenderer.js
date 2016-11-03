/**
 * Editor Renderer This class is responsible for rendering the editor model
 */
define("PeekCanvasRenderer", [
            // Named Dependencies
            // Unnamed Dependencies
            "PeekCanvasExtensions"
        ],
        function () {
            function PeekCanvasRenderer($scope, config, model, dispDelegate) {
                var self = this;

                self.scope = $scope;
                self.config = config;
                self.model = model;
                self.dispDelegate = dispDelegate;

                self.canvas = null;
                self.isValid = false;

                self.drawEvent = $.Callbacks();

                self._zoom = 1.0;
                self._pan = {
                    x: 0.0,
                    y: 0.0
                };

                self.scope = $scope;
                self.config = config

            }

            PeekCanvasRenderer.prototype.invalidate = function () {
                var self = this;
                self.isValid = false;
            };

            PeekCanvasRenderer.prototype.setCanvas = function (canvas) {
                var self = this;
                self.canvas = canvas;
                self._init();
            };

            PeekCanvasRenderer.prototype._init = function () {
                var self = this;

                // Start the draw timer.
                setInterval(bind(self, self.draw), self.config.renderer.drawInterval);

                // ------------------------------------------
                // Watch zoom
                //self.zoom(self.config.canvas.zoom / self._zoom);

                self.scope.$watch(function () {
                    return self.config.canvas.zoom;
                }, function (newVal) {
                    if (newVal == self._zoom)
                        return;
                    self.zoom(newVal / self._zoom);
                });

                // ------------------------------------------
                // Apply pan
                //self.pan();

                self.scope.$watch(function () {
                    var p = self.config.canvas.pan;
                    return {x: p.x, y: p.y};
                }, bind(self, self.pan), true);

                // ------------------------------------------
                // Watch for canvas size changes
                self.scope.$watch(function () {
                    return {h: self.canvas.clientHeight, w: self.canvas.clientWidth};
                }, bind(self, self.resizeCanvas), true);

                // ------------------------------------------
                // Watch for invalidates
                self.scope.$watch(function () {
                    return self.config.renderer.invalidate;
                }, function (invalidate) {
                    if (self.config.renderer.invalidate == false)
                        return;
                    self.invalidate();
                    self.config.renderer.invalidate = false;
                });

            };

            PeekCanvasRenderer.prototype.currentViewArea = function () {
                var self = this;

                var size = {
                    w: self.canvas.clientWidth / self._zoom,
                    h: self.canvas.clientHeight / self._zoom
                };

                return {
                    x: self._pan.x - size.w / 2,
                    y: self._pan.y - size.h / 2,
                    w: size.w,
                    h: size.h
                }
            };

            PeekCanvasRenderer.prototype.resizeCanvas = function () {
                var self = this;

                // Update the size of the canvas
                self.canvas.height = self.canvas.clientHeight;
                self.canvas.width = self.canvas.clientWidth;
                self.invalidate();
            };

            PeekCanvasRenderer.prototype.zoom = function (multiplier) {
                var self = this;
                var ctx = self.canvas.getContext('2d');

                if (self._zoom * multiplier < self.config.canvas.minZoom) {
                    // MIN ZOOM
                    multiplier = self.config.canvas.minZoom / self._zoom;


                } else if (self._zoom * multiplier > self.config.canvas.maxZoom) {
                    // MAX ZOOM
                    multiplier = self.config.canvas.maxZoom / self._zoom;

                }

                self._zoom *= multiplier;
                self.config.canvas.zoom = self._zoom;

                self.config.canvas.window = self.currentViewArea();

                self.invalidate();

            };

            PeekCanvasRenderer.prototype.pan = function () {
                var self = this;

                var pan = self.config.canvas.pan;

                self._pan.x = pan.x;
                self._pan.y = pan.y;

                self.config.canvas.window = self.currentViewArea();

                self.invalidate();
            };

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
            PeekCanvasRenderer.prototype.draw = function () {
                var self = this;

                // if our state is invalid, redraw and validate!
                if (self.isValid)
                    return;

                self.isValid = true;

                var ctx = self.canvas.getContext('2d');

                var dispObjs = self.model.viewableDisps();
                var selectedCoords = self.model.selectedDisps();

                // Clear canvas
                var w = self.canvas.width / self._zoom;
                var h = self.canvas.height / self._zoom;

                ctx.save();

                ctx.translate(self.canvas.width / 2.0, self.canvas.height / 2.0);
                ctx.scale(self._zoom, self._zoom);
                ctx.translate(-self._pan.x, -self._pan.y);

                ctx.fillStyle = self.config.renderer.backgroundColor;
                ctx.fillRect(self._pan.x - w, self._pan.y - h, w * 2, h * 2);

                // ** Add stuff you want drawn in the background all the time here **
                self._drawGrid(ctx);

                // draw all shapes, counting backwards for correct rendering
                // for (var i = dispObjs.length - 1; i != -1; i--) {

                // draw all shapes, counting forwards for correct order or rendering
                for (var i = 0; i < dispObjs.length; i++) {
                    var dispObj = dispObjs[i];
                    self.dispDelegate.draw(dispObj, ctx, self._zoom, self._pan);
                }

                // draw selection
                // right now this is just a stroke along the edge of the selected Shape
                for (var i = 0; i < selectedCoords.length; i++) {
                    var dispObj = selectedCoords[i];
                    self.dispDelegate.drawSelected(dispObj, ctx, self._zoom, self._pan);
                }

                // ** Add stuff you want drawn on top all the time here **
                // Tell the canvas mouse handler to draw what ever its got going on.
                self.drawEvent.fire(ctx);

                ctx.restore();
            };

            /**
             * Draw Selection Box Draws a selection box on the canvas
             */
            PeekCanvasRenderer.prototype._drawGrid = function (ctx) {
                var self = this;

                if (!self.config.renderer.grid.show)
                    return;

                var area = self.config.canvas.window;
                var zoom = self.config.canvas.zoom;

                var unscale = 1.0 / zoom;

                var gridSize = gridSizeForZoom(zoom);

                var minX = area.x;
                var minY = area.y;
                var maxX = area.x + area.w;
                var maxY = area.y + area.h;


                // Round the X min/max
                var minGridX = parseInt(minX / gridSize.xGrid);
                var maxGridX = parseInt(maxX / gridSize.xGrid) + 1;

                // Round the Y min/max
                var minGridY = parseInt(minY / gridSize.yGrid);
                var maxGridY = parseInt(maxY / gridSize.yGrid) + 1;

                ctx.lineWidth = self.config.renderer.grid.lineWidth / self._zoom;
                ctx.strokeStyle = self.config.renderer.grid.color;

                ctx.fillStyle = self.config.renderer.grid.color;
                ctx.textAlign = 'start';
                ctx.textBaseline = 'top';
                ctx.font = self.config.renderer.grid.font;

                // Draw the vertical lines
                for (var x = minGridX; x < maxGridX; x++) {
                    ctx.beginPath();
                    ctx.moveTo(x * gridSize.xGrid, minY);
                    ctx.lineTo(x * gridSize.xGrid, maxY);
                    ctx.stroke();
                }

                // Draw the horizontal lines
                for (var y = minGridY; y < maxGridY; y++) {
                    ctx.beginPath();
                    ctx.moveTo(minX, y * gridSize.yGrid);
                    ctx.lineTo(maxX, y * gridSize.yGrid);
                    ctx.stroke();
                }

                // Draw the vertical lines
                for (var x = minGridX; x < maxGridX; x++) {
                    for (var y = minGridY; y < maxGridY; y++) {
                        var text = x.toString() + "x" + y.toString();

                        // draw fixed size font
                        ctx.save();
                        ctx.translate(x * gridSize.xGrid + 15, y * gridSize.yGrid + 15);
                        ctx.scale(unscale, unscale);
                        ctx.fillText(text, 0, 0);
                        ctx.restore();
                    }
                }


            };

            /**
             * Return the size of the canvas
             */
            PeekCanvasRenderer.prototype.canvasInnerBounds = function () {
                var c = this._canvas;
                return new Bounds(0, 0, c.width, c.height);
            };

            return PeekCanvasRenderer;
        }
);