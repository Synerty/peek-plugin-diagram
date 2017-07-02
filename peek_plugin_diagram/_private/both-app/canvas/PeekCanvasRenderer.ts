import {EventEmitter} from "@angular/core";
import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekCanvasModel} from "./PeekCanvasModel";

export class PeekCanvasPan {
        
                    x: 0.0;
                    y: 0.0;
}

/**
 * Editor Renderer This class is responsible for rendering the editor model
 */
class PeekCanvasRenderer {
    
                canvas = null;
                isValid = false;

                drawEvent = new EventEmitter<null>();

                _zoom = 1.0;
                _pan = new PeekCanvasPan();

    
            constructor(private config:PeekCanvasConfig, private model:PeekCanvasModel, private dispDelegate:PeekDispRenderFactory) {
                


            }

            invalidate () {
                
                this.isValid = false;
            };

            setCanvas (canvas) {
                
                this.canvas = canvas;
                this._init();
            };

            _init () {
                

                // Start the draw timer.
                setInterval(() => this.draw(), this.config.renderer.drawInterval);

                // ------------------------------------------
                // Watch zoom
                //this.zoom(this.config.canvas.zoom / this._zoom);

                // TODO, Change these to observables, based on the "config" service
                this.scope.$watch(function () {
                    return this.config.canvas.zoom;
                }, function (newVal) {
                    if (newVal == this._zoom)
                        return;
                    this.zoom(newVal / this._zoom);
                });

                // ------------------------------------------
                // Apply pan
                //this.pan();

                this.scope.$watch(function () {
                    let p = this.config.canvas.pan;
                    return {x: p.x, y: p.y};
                }, () => this.pan(), true);

                // ------------------------------------------
                // Watch for canvas size changes
                this.scope.$watch(function () {
                    return {h: this.canvas.clientHeight, w: this.canvas.clientWidth};
                }, () =>  this.resizeCanvas(), true);

                // ------------------------------------------
                // Watch for invalidates
                this.scope.$watch(function () {
                    return this.config.renderer.invalidate;
                }, function (invalidate) {
                    if (this.config.renderer.invalidate == false)
                        return;
                    this.invalidate();
                    this.config.renderer.invalidate = false;
                });

            };

            currentViewArea () {
                

                let size = {
                    w: this.canvas.clientWidth / this._zoom,
                    h: this.canvas.clientHeight / this._zoom
                };

                return {
                    x: this._pan.x - size.w / 2,
                    y: this._pan.y - size.h / 2,
                    w: size.w,
                    h: size.h
                }
            };

            resizeCanvas () {
                

                // Update the size of the canvas
                this.canvas.height = this.canvas.clientHeight;
                this.canvas.width = this.canvas.clientWidth;
                this.invalidate();
            };

            zoom (multiplier) {
                
                let ctx = this.canvas.getContext('2d');

                if (this._zoom * multiplier < this.config.canvas.minZoom) {
                    // MIN ZOOM
                    multiplier = this.config.canvas.minZoom / this._zoom;


                } else if (this._zoom * multiplier > this.config.canvas.maxZoom) {
                    // MAX ZOOM
                    multiplier = this.config.canvas.maxZoom / this._zoom;

                }

                this._zoom *= multiplier;
                this.config.canvas.zoom = this._zoom;

                this.config.canvas.window = this.currentViewArea();

                this.invalidate();

            };

            pan () {
                

                let pan = this.config.canvas.pan;

                this._pan.x = pan.x;
                this._pan.y = pan.y;

                this.config.canvas.window = this.currentViewArea();

                this.invalidate();
            };

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
            draw () {
                

                // if our state is invalid, redraw and validate!
                if (this.isValid)
                    return;

                this.isValid = true;

                let ctx = this.canvas.getContext('2d');

                let dispObjs = this.model.viewableDisps();
                let selectedCoords = this.model.selectedDisps();

                // Clear canvas
                let w = this.canvas.width / this._zoom;
                let h = this.canvas.height / this._zoom;

                ctx.save();

                ctx.translate(this.canvas.width / 2.0, this.canvas.height / 2.0);
                ctx.scale(this._zoom, this._zoom);
                ctx.translate(-this._pan.x, -this._pan.y);

                ctx.fillStyle = this.config.renderer.backgroundColor;
                ctx.fillRect(this._pan.x - w, this._pan.y - h, w * 2, h * 2);

                // ** Add stuff you want drawn in the background all the time here **
                this._drawGrid(ctx);

                // draw all shapes, counting backwards for correct rendering
                // for (let i = dispObjs.length - 1; i != -1; i--) {

                // draw all shapes, counting forwards for correct order or rendering
                for (let i = 0; i < dispObjs.length; i++) {
                    let dispObj = dispObjs[i];
                    this.dispDelegate.draw(dispObj, ctx, this._zoom, this._pan);
                }

                // draw selection
                // right now this is just a stroke along the edge of the selected Shape
                for (let i = 0; i < selectedCoords.length; i++) {
                    let dispObj = selectedCoords[i];
                    this.dispDelegate.drawSelected(dispObj, ctx, this._zoom, this._pan);
                }

                // ** Add stuff you want drawn on top all the time here **
                // Tell the canvas mouse handler to draw what ever its got going on.
                this.drawEvent.fire(ctx);

                ctx.restore();
            };

            /**
             * Draw Selection Box Draws a selection box on the canvas
             */
            _drawGrid (ctx) {
                

                if (!this.config.renderer.grid.show)
                    return;

                let area = this.config.canvas.window;
                let zoom = this.config.canvas.zoom;

                let unscale = 1.0 / zoom;

                let gridSize = gridSizeForZoom(zoom);

                let minX = area.x;
                let minY = area.y;
                let maxX = area.x + area.w;
                let maxY = area.y + area.h;


                // Round the X min/max
                let minGridX = parseInt(minX / gridSize.xGrid);
                let maxGridX = parseInt(maxX / gridSize.xGrid) + 1;

                // Round the Y min/max
                let minGridY = parseInt(minY / gridSize.yGrid);
                let maxGridY = parseInt(maxY / gridSize.yGrid) + 1;

                ctx.lineWidth = this.config.renderer.grid.lineWidth / this._zoom;
                ctx.strokeStyle = this.config.renderer.grid.color;

                ctx.fillStyle = this.config.renderer.grid.color;
                ctx.textAlign = 'start';
                ctx.textBaseline = 'top';
                ctx.font = this.config.renderer.grid.font;

                // Draw the vertical lines
                for (let x = minGridX; x < maxGridX; x++) {
                    ctx.beginPath();
                    ctx.moveTo(x * gridSize.xGrid, minY);
                    ctx.lineTo(x * gridSize.xGrid, maxY);
                    ctx.stroke();
                }

                // Draw the horizontal lines
                for (let y = minGridY; y < maxGridY; y++) {
                    ctx.beginPath();
                    ctx.moveTo(minX, y * gridSize.yGrid);
                    ctx.lineTo(maxX, y * gridSize.yGrid);
                    ctx.stroke();
                }

                // Draw the vertical lines
                for (let x = minGridX; x < maxGridX; x++) {
                    for (let y = minGridY; y < maxGridY; y++) {
                        let text = x.toString() + "x" + y.toString();

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
            canvasInnerBounds () {
                let c = this.canvas;
                return new PeekCanvasBounds(0, 0, c.width, c.height);
            };

        }
