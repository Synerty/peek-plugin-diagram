// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
function CanvasMouseTextDelegate(canvasMouse) {
	this._canvasMouse = canvasMouse;

	// Stores the rectangle being created
	this._creating = null;
	this._enteredText = null;

	// See mousedown and mousemove events for explanation
	this._startMousePos = null;

}
// Setup inheritance
CanvasMouseTextDelegate.inheritsFrom(CanvasMouseDelegate);

// Reset data.
CanvasMouseTextDelegate.prototype._reset = function() {
	this._creating = null;
	this._enteredText = null;
	this._startMousePos = null;
}

// fixes a problem where double clicking causes
// text to get selected on the canvas
// CanvasMouseTextDelegate.prototype.mouseSelectStart =
// function(event,
// mouse) {
// };

CanvasMouseTextDelegate.prototype.keyPress = function(event) {
	if (!this._creating)
		return;

	if (event.keyCode == 8) { // Backspace
		if (this._enteredText && this._enteredText.length)
			this._enteredText = this._enteredText.substr(0,
					this._enteredText.length - 1);
		else
			this._enteredText = '';
		this._creating.setText(this._enteredText);
		editorRenderer.invalidate();
		return;
	}

	if (event.keyCode == 13) { // Enter
		this._finaliseCreate();
	}

	var inp = String.fromCharCode(event.keyCode);
	if (/[a-zA-Z0-9-_ .,`"'|~!@#$%^&*()-=+{}\[\]\\:;<>\/?]/.test(inp)) {
		this._enteredText = (this._enteredText || '') + inp;
		this._creating.setText(this._enteredText);
		editorRenderer.invalidate();
		return;
	}
};

CanvasMouseTextDelegate.prototype.keyUp = function(event) {
	if (!this._creating)
		return;

	if (event.keyCode == 46 // delete
			|| event.keyCode == 27) { // escape
		this._reset();
		return;
	}
}

CanvasMouseTextDelegate.prototype.mouseDown = function(event, mouse) {
	this._finaliseCreate();
	this._startMousePos = mouse;
};

CanvasMouseTextDelegate.prototype.mouseUp = function(event, mouse) {
	if (this._hasPassedDragThreshold(this._startMousePos, mouse)) {
		this._reset();
		return;
	}

	this._creating = new TextRenderable(mouse.x, mouse.y);
	this._creating.setPage(editorPage.currentPageId());
	this._creating.setLayer(this.newObjectLayer());
	if (editorUi.grid.snapping())
		this._creating.snap(editorUi.grid.snapSize());
	editorRenderer.invalidate();
};

CanvasMouseTextDelegate.prototype.delegateWillBeTornDown = function() {
	this._finaliseCreate();
};

CanvasMouseTextDelegate.prototype.draw = function(ctx) {
	if (this._creating)
		this._creating.draw(ctx);
};

CanvasMouseTextDelegate.prototype._finaliseCreate = function() {
	if (this._enteredText && this._creating)
		this._creating.storeState();

	this._reset();
	editorRenderer.invalidate();
};
