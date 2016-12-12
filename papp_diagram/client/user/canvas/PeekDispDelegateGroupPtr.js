define("PeekDispDelegateGroupPtr", [
            // Named Dependencies
            "PeekCanvasBounds"
            // Unnamed Dependencies
        ],
        function (PeekCanvasBounds) {
// ============================================================================
// PeekDispDelegateGroupPtr
// ============================================================================
            function PeekDispDelegateGroupPtr($scope, config, refData) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._refData = refData;
            }


            PeekDispDelegateGroupPtr.prototype.draw = function (dispGroupPtr, ctx, zoom, pan) {
                var self = this;

                var dispGroup = peekModelCache.dispGroupForId(dispGroupPtr.gid);

                if (dispGroup == null)
                    return;

                // Give more meaning to our short field names
                var point = dispGroupPtr.g[0];
                var rotation = dispGroupPtr.r / 180.0 * Math.PI;
                var verticalScale = dispGroupPtr.vs;
                var horizontalScale = dispGroupPtr.hs;

                ctx.save();
                ctx.translate(point.x, point.y);
                ctx.rotate(rotation);
                ctx.scale(verticalScale, horizontalScale);

                // Draw the items for the group we point to
                for (var i = 0; i < dispGroup.items.length; i++) {
                    var dispItem = dispGroup.items[i];
                    self._scope.canvasC.dispDelegate.draw(dispItem, ctx, zoom, pan);
                }

                ctx.restore();

            };

            PeekDispDelegateGroupPtr.prototype.drawSelected = function (polyObj, ctx, zoom, pan) {

            };

            PeekDispDelegateGroupPtr.prototype.contains = function (polyObj, x, y, margin) {
                return false;
            };

            PeekDispDelegateGroupPtr.prototype.withIn = function (polyObj, x, y, w, h) {
                return false;
            };

            PeekDispDelegateGroupPtr.prototype.handles = function (polyObj) {
                return [];
            };

            PeekDispDelegateGroupPtr.prototype.deltaMove = function (polyObj, dx, dy) {
            };

            PeekDispDelegateGroupPtr.prototype.area = function (dispEllipse) {
                var self = this;
                return 0;
            };

            return PeekDispDelegateGroupPtr;
        }
);