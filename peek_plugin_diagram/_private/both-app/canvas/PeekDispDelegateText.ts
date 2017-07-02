define("PeekDispDelegateText", [
            // Named Dependencies
            "PeekCanvasBounds"
            // Unnamed Dependencies
        ],
        function (PeekCanvasBounds) {
            // ============================================================================
// PeekDispDelegateText
// ============================================================================
            function PeekDispDelegateText($scope, config, refData) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._refData = refData;
            }

            PeekDispDelegateText.prototype.draw = function (dispText, ctx, zoom, pan) {
                var self = this;

                // Give meaning to our short names
                var rotationRadian = dispText.r / 180.0 * Math.PI;

                var point = dispText.g[0]; // get details of point

                var fontStyle = dispText.textStyle;
                var fillColor = dispText.color;

                // Null colors are also not drawn
                fillColor = (fillColor && fillColor.color) ? fillColor : null;

                // TODO, Draw a box around the text, based on line style

                var fontSize = fontStyle.fontSize * fontStyle.scaleFactor;

                var font = fontSize + "px " + fontStyle.fontName + " "
                        + (fontStyle.fontStyle || '');

                var lineHeight = pointToPixel(fontSize);

                var textAlign = null;
                if (dispText.ha == -1)
                    textAlign = 'start';
                else if (dispText.ha == 0)
                    textAlign = 'center';
                else if (dispText.ha == 1)
                    textAlign = 'end';

                var textBaseline = null;
                if (dispText.va == -1)
                    textBaseline = 'top';
                else if (dispText.va == 0)
                    textBaseline = 'middle';
                else if (dispText.va == 1)
                    textBaseline = 'bottom';

                // save state
                ctx.save();
                ctx.translate(point.x, point.y);
                ctx.rotate(rotationRadian); // Degrees to radians

                ctx.textAlign = textAlign;
                ctx.textBaseline = textBaseline;
                ctx.font = font;

                if (!fontStyle.scalable) {
                    var unscale = 1.0 / zoom;
                    ctx.scale(unscale, unscale);
                }

                var lines = dispText.te.split("\n");
                for (var lineIndex = 0; lineIndex < lines.length; ++lineIndex) {
                    var line = lines[lineIndex];
                    var yOffset = lineHeight * lineIndex;

                    if (fillColor) {
                        ctx.fillStyle = fillColor.color;
                        ctx.fillText(line, 0, yOffset);
                    }

                    //if (dispText.lineColor) {
                    //    ctx.lineWidth = dispText.lineSize;
                    //    ctx.strokeStyle = dispText.lineColor;
                    //    ctx.strokeText(line, 0, yOffset);
                    //}
                }

//    self._bounds.w = ctx.measureText(self.text).width;
//    self._bounds.h = lineHeight * lines.length;
//
                // restore to original state
                ctx.restore();
//
//    if (self.ha == -1)
//        self._bounds.x = left;
//    else if (self.ha == 0)
//        self._bounds.x = left - self._bounds.w / 2;
//    else if (self.ha == 1)
//        self._bounds.x = left - self._bounds.w;
//
//    if (self.va == -1)
//        self._bounds.y = top;
//    else if (self.va == 0)
//        self._bounds.y = top - self._bounds.h / 2;
//    else if (self.va == 1)
//        self._bounds.y = top - self._bounds.h;
            };

            PeekDispDelegateText.prototype.drawSelected = function (dispText, ctx, zoom, pan) {
            };

            PeekDispDelegateText.prototype.contains = function (dispText, x, y, margin) {
                return false;
            };

            PeekDispDelegateText.prototype.withIn = function (dispText, x, y, w, h) {
                return false;
            };

            PeekDispDelegateText.prototype.handles = function (dispText) {
                return [];
            };

            PeekDispDelegateText.prototype.deltaMove = function (dispText, dx, dy) {
            };

            PeekDispDelegateText.prototype.area = function (dispText) {
                var self = this;
                return 0;
            };

            return PeekDispDelegateText;
        }
);