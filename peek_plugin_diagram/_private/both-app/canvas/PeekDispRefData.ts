/** Peek Canvas Coord Tuple
 *
 * This class is an extension of the Coord Tuple, that allows it to be rendered by the
 * canvas.
 */

define("PeekDispRefData", [
            // Named Dependencies
            // Unnamed Dependencies
        ],
        function () {
            // ============================================================================
            // PeekDispRefData
            // ============================================================================
            function PeekDispRefData($scope, config) {
                var self = this;

                self._scope = $scope;
                self._config = config;
            }

            PeekDispRefData.prototype.textStyleForId = function (textStyleId) {
                return peekModelCache.textStyleForId(textStyleId);
            };


            PeekDispRefData.prototype.colorForId = function (colorId) {
                return peekModelCache.colorForId(colorId);
            };


            PeekDispRefData.prototype.layerForId = function (layerId) {
                return peekModelCache.layerForId(layerId);
            };


            PeekDispRefData.prototype.levelForId = function (levelId) {
                return peekModelCache.levelForId(levelId);
            };


            PeekDispRefData.prototype.lineStyleForId = function (lineStyleId) {
                return peekModelCache.lineStyleForId(lineStyleId);
            };

            return PeekDispRefData;
        }
);