// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */

function CanvasMouseDelegate() {
    var self = this;

	self._canvasMouse = null;
}

/** The distance to move before its a drag * */
CanvasMouseDelegate.DRAG_START_THRESHOLD = 5;

/** The time it takes to do a click, VS a click that moved slighltly * */
CanvasMouseDelegate.DRAG_TIME_THRESHOLD = 200;

CanvasMouseDelegate.prototype._hasPassedDragThreshold = function(m1, m2) {
    var self = this;

	var d = false;
	// Time has passed
	d |= ((m2.time.getTime() - m1.time.getTime()) > CanvasMouseDelegate.DRAG_TIME_THRESHOLD);
	// Mouse has moved
	d |= (Math.abs(m1.x - m2.x) > CanvasMouseDelegate.DRAG_START_THRESHOLD);
	d |= (Math.abs(m1.y - m2.y) > CanvasMouseDelegate.DRAG_START_THRESHOLD);

	return d;
};

CanvasMouseDelegate.prototype.keyDown = function(event) {
};

CanvasMouseDelegate.prototype.keyPress = function(event) {
};

CanvasMouseDelegate.prototype.keyUp = function(event) {
};

CanvasMouseDelegate.prototype.mouseSelectStart = function(event, mouse) {
};

CanvasMouseDelegate.prototype.mouseDown = function(event, mouse) {
};

CanvasMouseDelegate.prototype.mouseMove = function(event, mouse) {
};

CanvasMouseDelegate.prototype.mouseUp = function(event, mouse) {
};

CanvasMouseDelegate.prototype.mouseDoubleClick = function(event, mouse) {
};

CanvasMouseDelegate.prototype.mouseWheel = function(event) {
};

CanvasMouseDelegate.prototype.delegateWillBeTornDown = function() {
};

CanvasMouseDelegate.prototype.draw = function(ctx) {
};

/**
 * Set Last Mouse Pos
 * 
 * Sets the last mouse pos depending on the snap
 * 
 * @param the
 *            current mouse object
 * @return An object containing the delta
 */
CanvasMouseDelegate.prototype._setLastMousePos = function(mouse) {
    var self = this;

	var dx = mouse.x - self._lastMousePos.x;
	var dy = mouse.y - self._lastMousePos.y;
	var dClientX = mouse.clientX - self._lastMousePos.clientX;
	var dClientY = mouse.clientY - self._lastMousePos.clientY;

	//if (editorUi.grid.snapping()) {
	//	var snapSize = editorUi.grid.snapSize();
	//	dx = Coord.snap(dx, snapSize);
	//	dy = Coord.snap(dy, snapSize);
	//}

	self._lastMousePos.x += dx;
	self._lastMousePos.y += dy;
	self._lastMousePos.clientX += dClientX;
	self._lastMousePos.clientY += dClientY;

	return {
		dx : dx,
		dy : dy,
		dClientX : dClientX,
		dClientY : dClientY
	};
};

CanvasMouseDelegate.prototype.newObjectLayer = function() {
    var self = this;
	
	var selectedLayers = editorLayer.selectedLayers();
	if (selectedLayers.length)
		return selectedLayers[selectedLayers.length - 1].id;

	return editorLayer.lastLayer().id;

};
