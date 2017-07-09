// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
function CanvasMousePolyDelegate(canvasMouse) {
    this._canvasMouse = canvasMouse;

    // Stores the rectangle being created
    this._creating = null;

    // Used to detect dragging and its the mouse position we use
    this._startMousePos = null;



}
// Setup inheritance
CanvasMousePolyDelegate.inheritsFrom(CanvasMouseDelegate);

// Reset data.
CanvasMousePolyDelegate.prototype._reset = function () {
    this._creating = null;
    this._startMousePos = null;
}

CanvasMousePolyDelegate.prototype.keyUp = function (event) {
    if (!this._creating)
        return;

    // Cancel creating object
    if (event.keyCode == 46 // delete
            || event.keyCode == 27) { // escape
        this._reset();
        return;
    }

    if (event.keyCode == 8) { // Backspace
        // We want to keep at least two points at all times
        if (this._creating.pointCount() < 3)
            return;
        // Remove last point
        this._creating.popPoint();
        editorRenderer.invalidate();
        return;
    }

    if (event.keyCode == 13) { // Enter
        this._finaliseCreate();
        return;
    }
}

CanvasMousePolyDelegate.prototype.mouseDown = function (event, mouse) {
    this._startMousePos = mouse;
};

CanvasMousePolyDelegate.prototype.mouseMove = function (event, mouse) {
    if (!this._creating)
        return;


    var coord = this._coord(event, mouse);
    this._creating.movePoint(this._creating.pointCount() - 1, coord.x, coord.y);
    editorRenderer.invalidate();
};

CanvasMousePolyDelegate.prototype.mouseUp = function (event, mouse) {

    var dragged = this._hasPassedDragThreshold(this._startMousePos, mouse);
    var coord = this._coord(event, this._startMousePos);
    this._startMousePos = null;

    if (dragged)
        return;

    if (event.button == 2) {
        this._finaliseCreate();
        return;
    }

    if (!this._creating) {
        this._creating = new PolyRenderable(coord.x, coord.y);
        //this._creating.setPage(editorPage.currentPageId());
        //this._creating.setLayer(this.newObjectLayer());
    }

    this._creating.addPoint(coord.x, coord.y);

    editorRenderer.invalidate();
};

CanvasMouseDelegate.prototype.mouseDoubleClick = function (event, mouse) {
    this._creating.setClosed(true);
    this._finaliseCreate();
};

CanvasMousePolyDelegate.prototype.delegateWillBeTornDown = function () {
    this._finaliseCreate();
};

CanvasMousePolyDelegate.prototype.draw = function (ctx) {
    if (this._creating)
        this._creating.draw(ctx);
};

CanvasMousePolyDelegate.prototype._finaliseCreate = function () {
    var poly = this._creating;

    this._reset();

    if (poly)
        this._canvasMouse._scope.pageMethods.cableCreateCallback(poly);

    editorRenderer.invalidate();
};

CanvasMousePolyDelegate.prototype._coord = function (event, mouse) {
    var coord = new Coord(mouse.x, mouse.y);

    //// Snap if required
    //if (editorUi.grid.snapping())
    //    coord.snap(editorUi.grid.snapSize());

    // When the shift key is pressed, we will align to x or y axis
    if (this._creating && event.shiftKey) {
        var lastCoord = this._creating
                .pointCoord(this._creating.pointCount() - 2);
        var dx = Math.abs(coord.x - lastCoord.x);
        var dy = Math.abs(coord.y - lastCoord.y);

        if (dx > dy)
            coord.y = lastCoord.y;
        else
            coord.x = lastCoord.x;
    }

    // return
    return coord;
};
