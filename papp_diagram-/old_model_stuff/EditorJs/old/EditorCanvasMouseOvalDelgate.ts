// ============================================================================
// Editor Canvas Mouse Oval Delegate

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
		.inheritsFrom(CanvasMouseDragCreateDelegate);

/**
 * Create Renderable Creates a new instance of the object this delegate is
 * supposed to create
 */
CanvasMouseOvalDelegate.prototype._createRenderable = function(bounds) {
	return new OvalRenderable(bounds.x, bounds.y, bounds.w, bounds.h);
}