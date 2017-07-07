// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */

function CanvasMouseClipboardDelegate(canvasMouse) {
	this._canvasMouse = canvasMouse;
	this._clipboard = [];
	this._lastMouseCoord = new Coord();
}
// Setup inheritance
CanvasMouseClipboardDelegate.inheritsFrom(CanvasMouseDelegate);

CanvasMouseClipboardDelegate.prototype.keyDown = function(event) {
};

CanvasMouseClipboardDelegate.prototype.keyPress = function(event) {
};

CanvasMouseClipboardDelegate.prototype.keyUp = function(event) {
	if (!event.ctrlKey)
		return;
	var key = String.fromCharCode(event.keyCode);

	switch (key) {
	case 'A':
		editorModel.clearSelection();
		editorModel
				.addSelection(editorModel.renderablesAvailibleForSelection());
		break;
	case 'C':
		var selection = editorModel.selectedRenderables().slice(0);
		this._clipboard = this._copy(selection);
		break;
	case 'V':
		this._paste(this._clipboard);
		break;
	case 'D':
		var selection = editorModel.selectedRenderables().slice(0);
		this._paste(this._copy(selection));
		break;
	case 'X':
		var selection = editorModel.selectedRenderables().slice(0);
		this._clipboard = this._copy(selection);
		editorModel.deleteRenderable(selection);
		break;
	}

};

CanvasMouseClipboardDelegate.prototype.mouseSelectStart = function(event,
		mouse) {
};

CanvasMouseClipboardDelegate.prototype.mouseDown = function(event, mouse) {
};

CanvasMouseClipboardDelegate.prototype.mouseMove = function(event, mouse) {
	this._lastMouseCoord = new Coord(mouse.x, mouse.y);
};

CanvasMouseClipboardDelegate.prototype.mouseUp = function(event, mouse) {
};

CanvasMouseClipboardDelegate.prototype.mouseDoubleClick = function(event,
		mouse) {
};

CanvasMouseClipboardDelegate.prototype.delegateWillBeTornDown = function() {
};

CanvasMouseClipboardDelegate.prototype.draw = function(ctx) {
};

CanvasMouseClipboardDelegate.prototype._copy = function(srcRends) {
	var dstRends = [];
	for ( var i = 0; i < srcRends.length; ++i) {
		var src = srcRends[i];
		dstRends.push(src.clone());
	}
	return dstRends;
};

CanvasMouseClipboardDelegate.prototype._paste = function(rends) {
	this._applyOffset(rends, this._lastMouseCoord.x, this._lastMouseCoord.y);
	for ( var i = 0; i < rends.length; ++i) {
		var copy = rends[i];
		copy.setPage(editorPage.currentPageId());
		copy.storeState();
	}
};

CanvasMouseClipboardDelegate.prototype._calculateTotalBounds = function(
		rends) {
	var lx = -1; // Left X
	var rx = -1; // Right X
	var uy = -1; // Upper Y
	var ly = -1; // Lower Y
	
	// Objects calculate their bounds when they are drawn
	// You can thank text for this :-|
	
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	var func = function(r) {
		r.draw(ctx);
		var b = r.bounds();
		if (lx == -1 || b.x < lx)
			lx = b.x;
		if (rx == -1 || rx < (b.x + b.w))
			rx = b.x + b.w;
		if (uy == -1 || b.y < uy)
			uy = b.y;
		if (ly == -1 || ly < (b.y + b.h))
			ly = b.y + b.h;
	}

	rends.forEach(func, this);

	return new Bounds(lx, uy, rx - lx, ly - uy);
};

CanvasMouseClipboardDelegate.prototype._applyOffset = function(rends, x, y) {
	var totalBounds = this._calculateTotalBounds(rends);
	var canvasBounds = editorRenderer.canvasInnerBounds();
	
	// Make sure we're not off the screen
	if (canvasBounds.w < x + totalBounds.w)
		x = canvasBounds.w - totalBounds.w;
	if (canvasBounds.h < y + totalBounds.h)
		y = canvasBounds.h - totalBounds.h;
	
	var offsetX = x - totalBounds.x;
	var offsetY = y - totalBounds.y;
	if (editorUi.grid.snapping()){
		var snapSize = editorUi.grid.snapSize();
		offsetX = Coord.snap(offsetX, snapSize);
		offsetY = Coord.snap(offsetY, snapSize);
	}
	
	var func = function(r) {
		r.deltaMove(offsetX, offsetY);
	}
	rends.forEach(func, this);
};
