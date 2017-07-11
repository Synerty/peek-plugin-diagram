/**
 * Editor Renderer This class is responsible for rendering the editor model
 */

function CanvasRenderer() {
    this._canvas = null;
    this._isValid = false;
    this._drawInterval = 30;

    this._gridColor = '#CCC';
    this._gridSnapDashedLen = 2;

    this.drawEvent = $.Callbacks();

    this._zoomLevel = 1.0;
    this._panOffset = {x: 0.0, y: 0.0};

    this._scope = null;
}

CanvasRenderer.SELECTION_COLOR = '#3399FF';
CanvasRenderer.SELECTION_WIDTH = 2;
CanvasRenderer.SELECTION_LINE_GAP = 2;
CanvasRenderer.SELECTION_DASH_LEN = 3;


CanvasRenderer.prototype.invalidate = function () {
    this._isValid = false;
};

CanvasRenderer.prototype.setScope = function (scope) {
    this._scope = scope;
};

CanvasRenderer.prototype.setCanvas = function (canvas) {
    this._canvas = canvas;
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;

    editorUi.canvasMouse.setCanvas(canvas);

    var this_ = this;
    setInterval(function () {
        this_.draw();
    }, this._drawInterval);

};

CanvasRenderer.prototype.zoom = function (multiplier) {
    var ctx = this._canvas.getContext('2d');
    var size = {
        w: this._canvas.offsetWidth / 2.0,
        h: this._canvas.offsetHeight / 2.0
    };

    var centerOffset = {
        x: size.w / this._zoomLevel - this._panOffset.x,
        y: size.h / this._zoomLevel - this._panOffset.y
    };

    var MIN_ZOOM_LEVEL = 0.1;
    var MAX_ZOOM_LEVEL = 10.0;

    if (this._zoomLevel * multiplier < MIN_ZOOM_LEVEL) {
       // MIN ZOOM
       multiplier = MIN_ZOOM_LEVEL / this._zoomLevel;


    } else if (this._zoomLevel * multiplier > MAX_ZOOM_LEVEL) {
        // MAX ZOOM
       multiplier = MAX_ZOOM_LEVEL / this._zoomLevel;

    }

    this._zoomLevel *= multiplier;

    ctx.scale(multiplier, multiplier);

    this._panOffset.x /= multiplier;
    this._panOffset.y /= multiplier;


    var newCenterOffset = {
        x: size.w / this._zoomLevel - this._panOffset.x,
        y: size.h / this._zoomLevel - this._panOffset.y
    };

    this.pan(newCenterOffset.x - centerOffset.x, newCenterOffset.y - centerOffset.y);
};

CanvasRenderer.prototype.pan = function (deltaX, deltaY) {
    this._panOffset.x += deltaX;
    this._panOffset.y += deltaY;

    var ctx = this._canvas.getContext('2d');
    ctx.translate(deltaX, deltaY);
    this.invalidate();

    if (this._scope)
        this._scope.$apply();
};

CanvasRenderer.prototype.draw = function () {
    // if our state is invalid, redraw and validate!
    if (this._isValid)
        return;

    var renderables = editorModel.renderables();

    var this_ = this;
    var callback = function () {
        this_._drawCallback(renderables);
    }

    editorImageCache.prepareCache(renderables, callback);
};

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasRenderer.prototype._drawCallback = function (renderables) {
    var ctx = this._canvas.getContext('2d');
    var selectedRenderables = editorModel.selectedRenderables();
    var layersToDraw = editorLayer.checkedLayers();
    if (layersToDraw.length)
        layersToDraw = new StorableDict().add(layersToDraw);
    else
        layersToDraw = null;

    // Clear canvas
    //ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(-100000, -100000, 200000, 200000);

    ctx.fillStyle = 'orange';
    ctx.fillRect(-10, -10, 20, 20);


    // ** Add stuff you want drawn in the background all the time here **
    this._drawGrid(ctx);

    // draw all shapes
    for (var i = 0; i < renderables.length; i++) {
        var renderable = renderables[i];
        if (layersToDraw && !layersToDraw.hasOwnProperty(renderable.layerId))
            continue;
        // We can skip the drawing of elements that have moved off the screen:
        // if (shape.x > this.width || shape.y > this.height ||
        // shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
        renderable.draw(ctx);
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected Shape
    for (var i = 0; i < selectedRenderables.length; i++) {
        selectedRenderables[i].drawSelected(ctx);
    }

    // ** Add stuff you want drawn on top all the time here **
    // Tell the canvas mouse handler to draw what ever its got going on.
    this.drawEvent.fire(ctx);

    this._isValid = true;
};

/**
 * Draw Selection Box Draws a selection box on the canvas
 */
CanvasRenderer.prototype._drawGrid = function (ctx) {
    if (!editorUi.grid.show())
        return;
    var grid = editorUi.grid.size();
    var snap = editorUi.grid.snapSize();

    // DISABLED
    // var snapsPerGrid = Math.floor(grid / snap) * snap;
    var snapsPerGrid = 1;

    var h = this._canvas.height;
    var w = this._canvas.width;

    ctx.lineWidth = 1;
    ctx.strokeStyle = this._gridColor;

    // Vertical and horizontal
    for (var g = 0; g < w / grid || g < h / grid; ++g) {
        for (var s = 0; s < snapsPerGrid; ++s) {
            var x = g * grid + s * snap;
            var y = x;
            // Vertical
            if (x < w) {
                ctx.beginPath();
                if (s == 0) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                } else {
                    ctx.dashedLine(x, 0, x, h, this._gridSnapDashedLen);
                }
                ctx.stroke();
            }
            // Horizontal
            if (y < h) {
                ctx.beginPath();
                if (s == 0) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                } else {
                    ctx.dashedLine(0, y, w, y, this._gridSnapDashedLen);
                }
                ctx.stroke();
            }
        }
    }

};

/**
 * Return the size of the canvas
 */
CanvasRenderer.prototype.canvasInnerBounds = function () {
    var c = this._canvas;
    return new Bounds(0, 0, c.width, c.height);
};

// ============================================================================
// Create editor renderer instance

var editorRenderer = null;
var _editorRendererInit = function () {
    editorRenderer = new CanvasRenderer();
};