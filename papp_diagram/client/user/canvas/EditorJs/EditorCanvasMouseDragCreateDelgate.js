// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
function CanvasMouseDragCreateDelegate() {

	// Stores the rectangle being created
	this._creating = null;

	this._startMousePos = null;
	this._dragThresholdPassed = false;

}
// Setup inheritance
CanvasMouseDragCreateDelegate.inheritsFrom(CanvasMouseDelegate);

// Reset data.
CanvasMouseDragCreateDelegate.prototype._reset = function() {
	this._creating = null;
	this._dragThresholdPassed = false;
	this._startMousePos = null;
}

/**
 * Create Renderable Creates a new instance of the object this delegate is
 * supposed to create
 */
CanvasMouseDragCreateDelegate.prototype._createRenderable = function(
		bounds) {
	alert("Not implemented");
}

// fixes a problem where double clicking causes
// text to get selected on the canvas
// CanvasMouseDragCreateDelegate.prototype.mouseSelectStart =
// function(event,
// mouse) {
// };

CanvasMouseDragCreateDelegate.prototype.mouseDown = function(event, mouse) {
	this._startMousePos = mouse;
};

CanvasMouseDragCreateDelegate.prototype.mouseMove = function(event, mouse) {
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

CanvasMouseDragCreateDelegate.prototype.mouseUp = function(event, mouse) {
	if (!this._creating) {
		this._canvasMouse.delegateFinished();
		return;
	}

	this._applySize(mouse);
	this._creating.storeState();

	this._reset();
};

CanvasMouseDragCreateDelegate.prototype.mouseDoubleClick = function(
		event, mouse) {
};

CanvasMouseDragCreateDelegate.prototype._applySize = function(mouse) {
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

CanvasMouseDragCreateDelegate.prototype.draw = function(ctx) {
	if (this._creating)
		this._creating.draw(ctx);
};
