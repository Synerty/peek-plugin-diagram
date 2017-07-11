// ============================================================================
// Editor Canvas Mouse Oval Delegate

// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
function EditorCanvasCreateNodeDelegate() {

    // Stores the rectangle being created
    this._creating = null;

    this._startMousePos = null;
    this._dragThresholdPassed = false;

}
// Setup inheritance
EditorCanvasCreateNodeDelegate.inheritsFrom(CanvasMouseDelegate);

// Reset data.
EditorCanvasCreateNodeDelegate.prototype._reset = function () {
    this._creating = null;
    this._dragThresholdPassed = false;
    this._startMousePos = null;
};

/**
 * Create Renderable Creates a new instance of the object this delegate is
 * supposed to create
 */
EditorCanvasCreateNodeDelegate.prototype._createRenderable = function (bounds) {
    alert("Not implemented");
};

// fixes a problem where double clicking causes
// text to get selected on the canvas
// EditorCanvasCreateNodeDelegate.prototype.mouseSelectStart =
// function(event,
// mouse) {
// };

EditorCanvasCreateNodeDelegate.prototype.mouseDown = function (event, mouse) {
    this._startMousePos = mouse;
};

EditorCanvasCreateNodeDelegate.prototype.mouseMove = function (event, mouse) {
    if (!this._startMousePos)
        return;

    if (!this._creating) {
        if (!this._hasPassedDragThreshold(this._startMousePos, mouse))
            return;

        var b = Bounds.fromPoints(this._startMousePos, mouse);
        this._creating = this._createRenderable(b);
        this._creating.setPage(editorPage.currentPageId());
        this._creating.setLayer(this.newObjectLayer());
        if (editorUi.grid.snapping())
            this._creating.snap(editorUi.grid.snapSize());
        return;
    }

    this._applySize(mouse);
};

EditorCanvasCreateNodeDelegate.prototype.mouseUp = function (event, mouse) {
    if (this._creating) {
        this._applySize(mouse);
    }

    var self = this;
    var oval = self._creating;

    self._reset();

    self._canvasMouse._scope.pageMethods.nodeCreateCallback(oval);

    editorRenderer.invalidate();
};

EditorCanvasCreateNodeDelegate.prototype.mouseDoubleClick = function (event, mouse) {
};

EditorCanvasCreateNodeDelegate.prototype._applySize = function (mouse) {
    if (!this._creating)
        return;

    var startMouse = new Coord(this._startMousePos.x, this._startMousePos.y);
    var mouse = new Coord(mouse.x, mouse.y);
    if (editorUi.grid.snapping()) {
        var snapSize = editorUi.grid.snapSize();
        mouse.snap(snapSize);
        startMouse.snap(snapSize);
    }

    var x = startMouse.x;
    if (mouse.x < x)
        x = mouse.x;

    var y = startMouse.y;
    if (mouse.y < y)
        y = mouse.y;

    var w = Math.abs(mouse.x - startMouse.x);
    var h = Math.abs(mouse.y - startMouse.y);

    this._creating.move(x, y);
    this._creating.resize(w, h);
    editorRenderer.invalidate();
};

EditorCanvasCreateNodeDelegate.prototype.draw = function (ctx) {
    if (this._creating)
        this._creating.draw(ctx);
};


/**
 * Editor Canvas Mouse Oval Delegate
 *
 * This delegate will create ovals
 *
 */
function CanvasMouseOvalDelegate(canvasMouse) {
    this._canvasMouse = canvasMouse;
}
// Setup inheritance
CanvasMouseOvalDelegate
        .inheritsFrom(EditorCanvasCreateNodeDelegate);

/**
 * Create Renderable Creates a new instance of the object this delegate is
 * supposed to create
 */
CanvasMouseOvalDelegate.prototype._createRenderable = function (bounds) {
    return new OvalRenderable(bounds.x, bounds.y, bounds.w, bounds.h);
};