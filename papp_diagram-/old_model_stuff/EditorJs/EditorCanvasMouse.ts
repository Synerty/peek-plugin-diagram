// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */

function CanvasMouse($scope) {
    var self = this;

    self._scope = $scope;

    self._delegate = new CanvasMouseSelectDelegate(this);
    // FIXME, It would be nice to have structure to call the delegates.
    // This is coded - multiple delegates should be able to work at the same
    // time. This means more simple delegates
    self._clipboarDelegate = new CanvasMouseClipboardDelegate(this);


}

CanvasMouse.prototype._notifyOfChange = function () {
    if (this._scope)
        this._scope.$apply();
};


CanvasMouse.prototype.setTool = function (tool) {
    if (this._delegate)
        this._delegate.delegateWillBeTornDown();

    if (tool == Tools.prototype.TOOL_SELECT)
        this._delegate = new CanvasMouseSelectDelegate(this);

    //else if (tool == Tools.prototype.TOOL_RECTANGLE)
    //    this._delegate = new CanvasMouseRectangleDelegate(this);

    else if (tool == Tools.prototype.TOOL_POLY)
        this._delegate = new CanvasMousePolyDelegate(this);

    else if (tool == Tools.prototype.TOOL_OVAL)
        this._delegate = new CanvasMouseOvalDelegate(this);

    //else if (tool == Tools.prototype.TOOL_TEXT)
    //    this._delegate = new CanvasMouseTextDelegate(this);
    //
    //else if (tool == Tools.prototype.TOOL_IMAGE)
    //    this._delegate = new CanvasMouseImageDelegate(this);

    else
        alert("Tool " + tool + " not implemented in canvas mouse");
}

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
CanvasMouse.prototype.delegateFinished = function () {
    editorUi.tool.selectSelector();
}

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
CanvasMouse.prototype._getMouse = function (e) {
    var element = this.canvas;
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
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    var mx = e.pageX - offsetX;
    var my = e.pageY - offsetY;

    var clientX = mx;
    var clientY = my;

    // Apply canvas scale and pan
    mx = mx / editorRenderer._zoomLevel - editorRenderer._panOffset.x;
    my = my / editorRenderer._zoomLevel - editorRenderer._panOffset.y;

    if (isNaN(mx))
        console.log("mx IS NaN");

    // We return a simple javascript object (a hash) with x and y defined
    return {
        x: mx,
        y: my,
        clientX: clientX,
        clientY: clientY,
        time: new Date()
    };
}

CanvasMouse.prototype.setCanvas = function (canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    var this_ = this;

    canvas.addEventListener('keydown', function (e) {
        this_._delegate.keyDown(e);
    }, true);
    canvas.addEventListener('keypress', function (e) {
        this_._delegate.keyPress(e);
    }, true);
    canvas.addEventListener('keyup', function (e) {
        this_._delegate.keyUp(e);
        this_._clipboarDelegate.keyUp(e);
    }, true);
    canvas.addEventListener('mousedown', function (e) {
        if (!e instanceof MouseEvent) return;
        this_._delegate.mouseDown(e, this_._getMouse(e));
    }, true);
    canvas.addEventListener('mousemove', function (e) {
        if (!e instanceof MouseEvent) return;
        this_._delegate.mouseMove(e, this_._getMouse(e))
        this_._clipboarDelegate.mouseMove(e, this_._getMouse(e));
    }, true);
    canvas.addEventListener('mouseup', function (e) {
        if (!e instanceof MouseEvent) return;
        this_._delegate.mouseUp(e, this_._getMouse(e));
    }, true);
    canvas.addEventListener('mousewheel', function (e) {
        if (!e instanceof MouseEvent) return;
        this_._delegate.mouseWheel(e, this_._getMouse(e));
        e.preventDefault();
        return false;
    }, true);
    canvas.addEventListener('dblclick', function (e) {
        if (!e instanceof MouseEvent) return;
        this_._delegate.mouseDoubleClick(e, this_._getMouse(e));
    }, true);

    canvas.addEventListener('selectstart', function (e) {
        //this_._delegate.mouseSelectStart(e, this_._getMouse(e));
        e.preventDefault();
        return false;
    }, true);
    canvas.addEventListener('contextmenu', disableContextMenu, true);

    // This complicates things a little but but fixes mouse co-ordinate
    // problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(
                self.canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(
                self.canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(
                self.canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(
                self.canvas, null)['borderTopWidth'], 10) || 0;
    }

    // Some pages have fixed-position bars (like the stumbleupon bar) at the
    // top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

}

/**
 * Draw Called by the renderer during a redraw.
 */
CanvasMouse.prototype.draw = function (ctx) {
    if (this._delegate)
        this._delegate.draw(ctx);
};
