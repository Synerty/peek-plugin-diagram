// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
define("PeekCanvasMouseDelegate", [], function () {

            function PeekCanvasMouseDelegate() {
                this._canvasMouse = null;
            }

            /** The distance to move before its a drag * */
            PeekCanvasMouseDelegate.DRAG_START_THRESHOLD = 5;

            /** The time it takes to do a click, VS a click that moved slighltly * */
            PeekCanvasMouseDelegate.DRAG_TIME_THRESHOLD = 200;

            PeekCanvasMouseDelegate.prototype._hasPassedDragThreshold = function (m1, m2) {
                var d = false;
                // Time has passed
                d |= ((m2.time.getTime() - m1.time.getTime()) > PeekCanvasMouseDelegate.DRAG_TIME_THRESHOLD);
                // Mouse has moved
                d |= (Math.abs(m1.x - m2.x) > PeekCanvasMouseDelegate.DRAG_START_THRESHOLD);
                d |= (Math.abs(m1.y - m2.y) > PeekCanvasMouseDelegate.DRAG_START_THRESHOLD);

                return d;
            };

            PeekCanvasMouseDelegate.prototype.keyDown = function (event) {
            };

            PeekCanvasMouseDelegate.prototype.keyPress = function (event) {
            };

            PeekCanvasMouseDelegate.prototype.keyUp = function (event) {
            };

            PeekCanvasMouseDelegate.prototype.mouseSelectStart = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.mouseDown = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.mouseMove = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.mouseUp = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.mouseDoubleClick = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.mouseWheel = function (event) {
            };

            PeekCanvasMouseDelegate.prototype.touchStart = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.touchMove = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.touchEnd = function (event, mouse) {
            };

            PeekCanvasMouseDelegate.prototype.delegateWillBeTornDown = function () {
            };

            PeekCanvasMouseDelegate.prototype.draw = function (ctx) {
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
            PeekCanvasMouseDelegate.prototype._setLastMousePos = function (mouse) {

                var dx = mouse.x - this._lastMousePos.x;
                var dy = mouse.y - this._lastMousePos.y;
                var dClientX = mouse.clientX - this._lastMousePos.clientX;
                var dClientY = mouse.clientY - this._lastMousePos.clientY;

                //if (editorUi.grid.snapping()) {
                //	var snapSize = editorUi.grid.snapSize();
                //	dx = Coord.snap(dx, snapSize);
                //	dy = Coord.snap(dy, snapSize);
                //}

                this._lastMousePos.x += dx;
                this._lastMousePos.y += dy;
                this._lastMousePos.clientX += dClientX;
                this._lastMousePos.clientY += dClientY;

                return {
                    dx: dx,
                    dy: dy,
                    dClientX: dClientX,
                    dClientY: dClientY
                };
            };

            PeekCanvasMouseDelegate.prototype.newObjectLayer = function () {
                var selectedLayers = editorLayer.selectedLayers();
                if (selectedLayers.length)
                    return selectedLayers[selectedLayers.length - 1].id;

                return editorLayer.lastLayer().id;

            };

            return PeekCanvasMouseDelegate;
        }
);