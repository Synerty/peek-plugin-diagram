// ============================================================================
// Editor Canvas Mouse Rectangle Delegate

/**
 * Editor Canvas Mouse Rectangle Delegate
 * 
 * This delegate will create ovals
 * 
 */
function CanvasMouseRectangleDelegate(canvasMouse) {
	this._canvasMouse = canvasMouse;
}
// Setup inheritance
CanvasMouseRectangleDelegate
		.inheritsFrom(CanvasMouseDragCreateDelegate);

/**
 * Create Renderable Creates a new instance of the object this delegate is
 * supposed to create
 */
CanvasMouseRectangleDelegate.prototype._createRenderable = function(
		bounds) {
	return new RectangleRenderable(bounds.x, bounds.y, bounds.w, bounds.h);
}