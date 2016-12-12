define("PeekDispDelegateEllipse", [
            // Named Dependencies
            "PeekCanvasBounds"
            // Unnamed Dependencies
        ],
        function (PeekCanvasBounds) {
// ============================================================================
// PeekDispDelegateEllipse
// ============================================================================
            function PeekDispDelegateEllipse($scope, config, refData) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._refData = refData;
            }


            PeekDispDelegateEllipse.prototype.draw = function (dispEllipse, ctx, zoom) {
                var self = this;

                var fillColor = dispEllipse.fillColor;
                var lineColor = dispEllipse.lineColor;

                // Null colors are also not drawn
                fillColor = (fillColor && fillColor.color) ? fillColor : null;
                lineColor = (lineColor && lineColor.color) ? lineColor : null;

                var xRadius = dispEllipse.xr;
                var yRadius = dispEllipse.yr;
                var rotationRadian = dispEllipse.r / 180.0 * Math.PI;
                var startAngle = dispEllipse.sa;
                var endAngle = dispEllipse.ea;
                var lineWidth = dispEllipse.w;

                var x = dispEllipse.g[0].x; // get details of point
                var y = dispEllipse.g[0].y;

                var yScale = yRadius / xRadius;

                // save state
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(1, yScale);
                ctx.rotate(rotationRadian);

                var startRadian = startAngle / 180.0 * Math.PI;
                var endRadian = endAngle / 180.0 * Math.PI;

                ctx.beginPath();
                ctx.arc(0, 0, xRadius, startRadian, endRadian, true);
                //ctx.closePath();

                if (fillColor) {
                    ctx.lineTo(0, 0); // Make it fill to the center, not just the ends of the arc
                    ctx.fillStyle = fillColor.color;
                    ctx.fill();
                }

                if (lineColor) {
                    ctx.strokeStyle = lineColor.color;
                    ctx.lineWidth = lineWidth / zoom;
                    ctx.stroke();
                }

                // restore to original state
                ctx.restore();


                //self._bounds.x = self.left;
                //self._bounds.y = self.top;
                //self._bounds.w = self.width;
                //self._bounds.h = self.height;
            };

            PeekDispDelegateEllipse.prototype.drawSelected = function (dispEllipse, ctx, zoom) {
            };

            PeekDispDelegateEllipse.prototype.contains = function (dispEllipse, x, y, margin) {
                return false;
            };

            PeekDispDelegateEllipse.prototype.withIn = function (dispEllipse, x, y, w, h) {
                return false;
            };

            PeekDispDelegateEllipse.prototype.handles = function (dispEllipse) {
                return [];
            };

            PeekDispDelegateEllipse.prototype.deltaMove = function (dispEllipse, dx, dy) {
            };

            PeekDispDelegateEllipse.prototype.area = function (dispEllipse) {
                var self = this;
                return dispEllipse.bounds.area();
            };


            return PeekDispDelegateEllipse;
        }
);