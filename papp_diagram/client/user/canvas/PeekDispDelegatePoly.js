define("PeekDispDelegatePoly", [
            // Named Dependencies
            "PeekCanvasBounds"
            // Unnamed Dependencies
        ],
        function (PeekCanvasBounds) {
// ============================================================================
// PeekDispDelegatePoly
// ============================================================================
            function PeekDispDelegatePoly($scope, config, refData) {
                var self = this;

                self._scope = $scope;
                self._config = config;
                self._refData = refData;
            }


            PeekDispDelegatePoly.prototype._drawLine = function (ctx, point1, point2, lineStyle, zoom) {
                var x1 = point1.x;
                var y1 = point1.y;
                var x2 = point2.x;
                var y2 = point2.y;

                if (lineStyle.dashPattern == null) {
                    ctx.lineTo(x2, y2);
                    return;
                }

                // FIXME HACK, Just hard code the dash len
                var dashLen = lineStyle.dashPattern[0] / zoom;

                ctx.moveTo(x1, y1);

                var dX = x2 - x1;
                var dY = y2 - y1;
                var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
                var dashX = dX / dashes;
                var dashY = dY / dashes;

                var q = 0;
                while (q++ < dashes) {
                    x1 += dashX;
                    y1 += dashY;
                    ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
                }
                ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
            };

            PeekDispDelegatePoly.prototype.draw = function (dispPoly, ctx, zoom, pan) {
                var self = this;

                var isPolygon = dispPoly._tt == 'DPG';

                var fillColor = isPolygon ? dispPoly.fillColor : null;
                var lineColor = dispPoly.lineColor;
                var lineStyle = dispPoly.lineStyle;

                // Null colors are also not drawn
                fillColor = (fillColor && fillColor.color) ? fillColor : null;
                lineColor = (lineColor && lineColor.color) ? lineColor : null;

                var fillDirection = dispPoly.fd;
                var fillPercentage = dispPoly.fp;

                var firstPoint = dispPoly.g[0]; // get details of point

                // Fill the background first, if required
                if (lineStyle.backgroundFillDashSpace) {
                    ctx.beginPath();
                    ctx.moveTo(firstPoint.x, firstPoint.y);

                    for (var i = 1; i < dispPoly.g.length; ++i) {
                        var point = dispPoly.g[i];
                        ctx.lineTo(point.x, point.y);
                    }

                    ctx.strokeStyle = self._config.renderer.backgroundColor;
                    ctx.lineWidth = dispPoly.w / zoom;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.moveTo(firstPoint.x, firstPoint.y);

                var lastPoint = firstPoint;
                for (var i = 1; i < dispPoly.g.length; ++i) {
                    var point = dispPoly.g[i];

                    // Draw the segment
                    self._drawLine(ctx, lastPoint, point, lineStyle, zoom);
                    lastPoint = point;

                }

                if (isPolygon)
                    ctx.closePath();

                if (lineColor) {
                    ctx.strokeStyle = lineColor.color;
                    ctx.lineWidth = dispPoly.w / zoom;
                    ctx.stroke();
                }

                if (fillColor) {
                    if (isPolygon && fillDirection != null && fillPercentage != null) {
                        self._drawSquarePercentFill(ctx,
                                PeekCanvasBounds.fromGeom(dispPoly.g),
                                fillColor, fillDirection, fillPercentage
                        );
                    } else {
                        ctx.fillStyle = fillColor.color;
                        ctx.fill();
                    }
                }

            };

            PeekDispDelegatePoly.prototype._drawSquarePercentFill = function (ctx, bounds,
                                                                              fillColor,
                                                                              fillDirection,
                                                                              fillPercentage) {
                var FILL_TOP_TO_BOTTOM = 0;
                var FILL_BOTTOM_TO_TOP = 1;
                var FILL_RIGHT_TO_LEFT = 2;
                var FILL_LEFT_TO_RIGHT = 3;

                if (fillDirection == FILL_TOP_TO_BOTTOM) {
                    bounds.h *= fillPercentage / 100.0;

                } else if (fillDirection == FILL_BOTTOM_TO_TOP) {
                    var oldh = bounds.h;
                    bounds.h *= fillPercentage / 100.0;
                    bounds.y += oldh - bounds.h;

                } else if (fillDirection == FILL_RIGHT_TO_LEFT) {
                    var oldw = bounds.w;
                    bounds.w *= fillPercentage / 100.0;
                    bounds.x += oldw - bounds.w;

                } else if (fillDirection == FILL_LEFT_TO_RIGHT) {
                    bounds.w *= fillPercentage / 100.0;

                }

                ctx.fillStyle = fillColor.color;
                ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

            }
            ;

            PeekDispDelegatePoly.prototype.drawSelected = function (dispPoly, ctx, zoom, pan) {
                var self = this;
                var selectionConfig = self._config.renderer.selection;

                // DRAW THE SELECTED BOX
                var bounds = dispPoly.bounds;

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
            };

            PeekDispDelegatePoly.prototype.contains = function (dispPoly, x, y, margin) {
                var self = this;
                return false;

                if (!dispPoly.bounds.contains(x, y, margin))
                    return false;

                var isPolygon = dispPoly._tt == 'DPG';
                // For PoF, We only want to hittest on connectivity
                if (isPolygon)
                    return false;

                // var x, y are mouse coordinates
                // var margin, is the tolerance,

                // var geom is an array, EG [{x:10,y:10}, {x:20,y:10}, {x:20,y:20}, {x:20,y:30}]
                var geom = dispPoly.g;


                /*
                 if (isPolygon) {
                 // Using the polygon line segment crossing algorithm.
                 function rayCrossesSegment(point, a, b) {
                 var px = point.x;
                 var py = point.y;
                 var swap = a.y > b.y;
                 var ax = swap ? b.x : a.x;
                 var ay = swap ? b.y : a.y;
                 var bx = swap ? a.x : b.x;
                 var by = swap ? a.y : b.y;

                 // alter longitude to cater for 180 degree crossings
                 if (px < 0)
                 px += 360;
                 if (ax < 0)
                 ax += 360;
                 if (bx < 0)
                 bx += 360;

                 if (py == ay || py == by) py += 0.00000001;
                 if ((py > by || py < ay) || (px > Math.max(ax, bx))) return false;
                 if (px < Math.min(ax, bx)) return true;

                 var red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
                 var blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
                 return (blue >= red);
                 }

                 var crossings = 0;

                 var pFirst = {x: dispPoly.bounds.x, y: dispPoly.bounds.y};
                 var p1 = pFirst;
                 for (var i = 1; i <= geom.length; ++i) {
                 var thisPoint = geom[i];
                 var p2 = (i == geom.length)
                 ? pFirst // The closing point
                 : thisPoint;

                 if (rayCrossesSegment({x: x, y: y}, p1, p2))
                 crossings++;

                 p1 = p2;
                 }

                 // odd number of crossings?
                 return (crossings % 2 == 1);

                 }
                 */

                // ELSE, POLYLINE
                var x1 = geom[0].x;
                var y1 = geom[0].y;
                for (var i = 1; i < geom.length; ++i) {
                    var x2 = geom[i].x;
                    var y2 = geom[i].y;


                    var dx = x2 - x1;
                    var dy = y2 - y1;

                    // For Bounding Box
                    var left = (x1 < x2 ? x1 : x2) - margin;
                    var right = (x1 < x2 ? x2 : x1) + margin;
                    var top = (y1 < y2 ? y1 : y2) - margin;
                    var bottom = (y1 < y2 ? y2 : y1) + margin;

                    // Special condition for vertical lines
                    if (dx == 0) {
                        if (left <= x && x <= right && top <= y && y <= bottom) {
                            return true;
                        }
                    }

                    var slope = dy / dx;
                    // y = mx + c
                    // intercept c = y - mx
                    var intercept = y1 - slope * x1; // which is same as y2 - slope * x2

                    var yVal = slope * x + intercept;
                    var xVal = (y - intercept) / slope;

                    if (((y - margin) < yVal && yVal < (y + margin)
                            || (x - margin) < xVal && xVal < (x + margin))
                            && (left <= x && x <= right && top <= y && y <= bottom))
                        return true;


                    x1 = x2;
                    y1 = y2;
                }

                return false;

            };

            PeekDispDelegatePoly.prototype.withIn = function (dispPoly, x, y, w, h) {
                return false;
            };

            PeekDispDelegatePoly.prototype.handles = function (dispPoly) {
                return [];

                /*
                 var self = this;
                 var result = [];

                 var MARG = Renderable.RESIZE_HANDLE_MARGIN;
                 var WID = Renderable.RESIZE_HANDLE_WIDTH;
                 var HALF_WID = WID / 2.0;

                 function addHandle(p, ref) {
                 var adj = (p.x - ref.x);
                 var opp = (p.y - ref.y);
                 var hypot = Math.sqrt(Math.pow(adj, 2) + Math.pow(opp, 2));

                 var multiplier = (WID + MARG) / hypot;

                 result.push(new PeekCanvasBounds(p.x + adj * multiplier - HALF_WID,
                 p.y + opp * multiplier - HALF_WID,
                 WID,
                 WID));
                 }

                 //function rotatePoint(point, theta) {
                 //    // Rotates the given polygon which consists of corners represented as (x,y),
                 //    // around the ORIGIN, clock-wise, theta degrees
                 //    var simTheta = Math.sin(theta);
                 //    var cosTheta = Math.cos(theta);
                 //
                 //    return {
                 //        x: point.x * cosTheta - point.y * simTheta,
                 //        y: point.y = point.x * simTheta + point.y * cosTheta
                 //    };
                 //}
                 //
                 // //
                 // // Calculates the angle ABC (in radians)
                 // //
                 // // A first point
                 // // C second point
                 // // B center point
                 // //
                 //
                 //function findAngle(A, B, C) {
                 //    var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
                 //    var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
                 //    var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
                 //    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
                 //}


                 var firstXy = {x: self.left, y: self.top};
                 addHandle(firstXy, self.points[0].coord(self));

                 var lastXy = firstXy;
                 for (var i = 0; i < self.points.length; ++i) {
                 var thisXy = self.points[i].coord(self);
                 var refXy = lastXy;
                 if (i + 1 < self.points.length) {
                 var nextXy = self.points[i + 1].coord(self);

                 //var angle = findAngle(lastXy, thisXy, nextXy);
                 //refXy = rotatePoint({x:lastXy.x - self.left, y:lastXy.y - self.top}, angle / 2);

                 refXy.x = (lastXy.x + nextXy.x) / 2;
                 refXy.y = (lastXy.y + nextXy.y) / 2;
                 }
                 addHandle(thisXy, refXy);
                 }

                 return result;
                 */
            };

            PeekDispDelegatePoly.prototype.deltaMove = function (dispPoly, dx, dy) {
            };

            PeekDispDelegatePoly.prototype.area = function (dispPoly) {
                var self = this;
                return 0;
            };
            return PeekDispDelegatePoly;
        }
);
