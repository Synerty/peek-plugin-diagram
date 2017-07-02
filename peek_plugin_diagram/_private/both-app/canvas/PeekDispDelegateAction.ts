define("PeekDispDelegateAction", [
            // Named Dependencies
            "PeekCanvasBounds"
            // Unnamed Dependencies
        ],
        function (PeekCanvasBounds) {
            // ============================================================================

// PeekDispDelegateAction
// ============================================================================
            function PeekDispDelegateAction($scope, config, refData) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._refData = refData;
            }


            PeekDispDelegateAction.prototype.draw = function (dispAction, ctx, zoom, pan) {
                var self = this;
                return;

                /*
                 var fillColor = self._refData.colorForId(dispAction.fc);
                 var lineColor = self._refData.colorForId(dispAction.lc);
                 var lineWidth = dispAction.w;

                 var point = dispAction.g[0];
                 var x = point.x;
                 var y = point.y;
                 var lx = x; // Low x
                 var ux = x; // Upper x
                 var ly = y; // Low y
                 var uy = y; // Upper y

                 ctx.beginPath();
                 ctx.moveTo(x, y);

                 for (var i = 1; i < dispAction.g.length; ++i) {
                 // Get the point
                 point = dispAction.g[i];
                 x = point.x;
                 y = point.y;

                 // Draw the segment
                 ctx.lineTo(x, y);

                 // Work out our bounds
                 if (x < lx)
                 lx = x;
                 if (ux < x)
                 ux = x;
                 if (y < ly)
                 ly = y;
                 if (uy < y)
                 uy = y;
                 }

                 ctx.closePath();

                 if (fillColor) {
                 ctx.fillStyle = fillColor.color;
                 ctx.fill();
                 }

                 if (lineColor) {
                 ctx.strokeStyle = lineColor.color;
                 ctx.lineWidth = lineWidth / zoom;
                 ctx.stroke();
                 }
                 */

                //self._bounds.x = lx;
                //self._bounds.y = ly;
                //self._bounds.w = ux - lx;
                //self._bounds.h = uy - ly;
            };

            PeekDispDelegateAction.prototype.drawSelected = function (actObj, ctx, zoom, pan) {
                var self = this;

                var selectionConfig = self._config.renderer.selection;

                // DRAW THE SELECTED BOX
                var bounds = actObj.bounds;

                // Move the selection line a bit away from the object
                var offset = (selectionConfig.width + selectionConfig.lineGap) / zoom;

                var twiceOffset = 2 * offset;
                var x = bounds.x - offset;
                var y = bounds.y - offset;
                var w = bounds.w + twiceOffset;
                var h = bounds.h + twiceOffset;

                ctx.dashedRect(x, y, w, h, selectionConfig.dashLen / zoom);
                ctx.strokeStyle = selectionConfig.color;
                ctx.lineWidth = selectionConfig.width / zoom;
                ctx.stroke();

                /*
                 // DRAW THE EDIT HANDLES
                 ctx.fillStyle = CanvasRenderer.SELECTION_COLOR;
                 var handles = this.handles();
                 for (var i = 0; i < handles.length; ++i) {
                 var handle = handles[i];
                 ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
                 }
                 */
            };

            PeekDispDelegateAction.prototype.contains = function (actObj, x, y, margin) {
                return actObj.bounds.contains(x, y, margin);
            };

            PeekDispDelegateAction.prototype.withIn = function (actObj, x, y, w, h) {
                return actObj.bounds.withIn(x, y, w, h);
            };

            PeekDispDelegateAction.prototype.handles = function (actObj) {
                return [];
            };

            PeekDispDelegateAction.prototype.deltaMove = function (actObj, dx, dy) {
            };

            PeekDispDelegateAction.prototype.area = function (actObj) {
                var self = this;
                return actObj.bounds.area();
            };


            return PeekDispDelegateAction;
        }
);