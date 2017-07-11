// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
function CanvasMouseImageDelegate(canvasMouse) {
	this._canvasMouse = canvasMouse;

	// See mousedown and mousemove events for explanation
	this._startMousePos = null;

}
// Setup inheritance
CanvasMouseImageDelegate.inheritsFrom(CanvasMouseDelegate);

// Reset data.
CanvasMouseImageDelegate.prototype._reset = function() {
	this._startMousePos = null;
}

CanvasMouseImageDelegate.prototype.mouseDown = function(event, mouse) {
	this._startMousePos = mouse;
};

CanvasMouseImageDelegate.prototype.mouseUp = function(event, mouse) {
	if (this._hasPassedDragThreshold(this._startMousePos, mouse)) {
		this._reset();
		return;
	}

	var creating = new ImageRenderable(mouse.x, mouse.y);
	creating.setPage(editorPage.currentPageId());
	creating.setLayer(this.newObjectLayer());
	if (editorUi.grid.snapping())
		creating.snap(editorUi.grid.snapSize());
	creating.storeState();
	this._reset();
};
