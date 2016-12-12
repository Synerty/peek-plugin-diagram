/**
 * Created by peek on 31/03/16.
 */


define("PeekCanvasBounds", [
            // Named Dependencies
            // Unnamed Dependencies
        ],
        function () {
            // ---------------------------------------------------------------------------
            // PeekCanvasBounds
            // ---------------------------------------------------------------------------
            function PeekCanvasBounds(x, y, w, h) {
                var self = this;

                if (x instanceof PeekCanvasBounds) {
                    self.x = parseFloat(x.x);
                    self.y = parseFloat(x.y);
                    self.w = parseFloat(x.w);
                    self.h = parseFloat(x.h);
                    return;
                }

                self.x = 0.0;
                self.y = 0.0;
                self.w = 0.0;
                self.h = 0.0;

                if (x)
                    self.x = parseFloat(x);

                if (y)
                    self.y = parseFloat(y);

                if (w)
                    self.w = parseFloat(w);

                if (h)
                    self.h = parseFloat(h);

                if (self.w < 0) {
                    self.w *= -1;
                    self.x = self.x - self.w;
                }

                if (self.h < 0) {
                    self.h *= -1;
                    self.y = self.y - self.h;
                }
            }

// Class method
            PeekCanvasBounds.fromGeom = function (geom) {
                var self = new PeekCanvasBounds();

                var firstPoint = geom[0]; // get details of point

                var lx = firstPoint.x; // Low x
                var ux = firstPoint.x; // Upper x
                var ly = firstPoint.y; // Low y
                var uy = firstPoint.y; // Upper y


                for (var i = 1; i < geom.length; ++i) {
                    var point = geom[i];

                    // Work out our bounds
                    if (point.x < lx)
                        lx = point.x;

                    if (ux < point.x)
                        ux = point.x;

                    if (point.y < ly)
                        ly = point.y;

                    if (uy < point.y)
                        uy = point.y;
                }

                self.x = lx;
                self.y = ly;
                self.w = ux - lx;
                self.h = uy - ly;

                return self;
            };

            PeekCanvasBounds.prototype.contains = function (x, y, margin) {
                var self = this;
                var b = this;

                // For Bounding Box
                var left = b.x - margin / 2;
                var right = b.x + b.w + margin / 2;
                var top = b.y - margin / 2;
                var bottom = b.y + b.h + margin / 2;

                return (left <= x && x <= right) //
                        && (top <= y && y <= bottom);
            };

            PeekCanvasBounds.prototype.withIn = function (x, y, w, h) {
                var self = this;
                if (x instanceof PeekCanvasBounds) {
                    y = x.y;
                    w = x.w;
                    h = x.h;
                    x = x.x;
                }

                var b = this;
                return (x <= b.x) && (b.x + b.w <= x + w) //
                        && (y <= b.y) && (b.y + b.h <= y + h);
            };

            PeekCanvasBounds.prototype.isEqual = function (other) {
                var self = this;

                if (!other instanceof PeekCanvasBounds)
                    return false;

                return (self.x === other.x) //
                        && (self.y === other.y) //
                        && (self.w === other.w) //
                        && (self.h === other.h) //
                        ;
            };

            PeekCanvasBounds.prototype.area = function () {
                var self = this;
                return self.w * self.h;
            };

            PeekCanvasBounds.prototype.toString = function () {
                var self = this;

                return self.x + "x," + self.y + "y," + self.w + "w," + self.h + "h,"
            };

            return PeekCanvasBounds;
        }
);