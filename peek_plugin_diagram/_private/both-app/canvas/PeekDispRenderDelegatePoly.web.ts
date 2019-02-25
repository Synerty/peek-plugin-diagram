import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispPolygon} from "../tuples/shapes/DispPolygon";
import {PointsT} from "../tuples/shapes/DispBase";
import {DispFactory, DispType} from "../tuples/shapes/DispFactory";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispPolyline} from "../tuples/shapes/DispPolyline";

export class PeekDispRenderDelegatePoly extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }


    private _drawLine(ctx, x1: number, y1: number, x2: number, y2: number,
                      dashPattern: null | number[],
                      zoom: number, segmentNum: number) {

        if (dashPattern == null) {
            ctx.lineTo(x2, y2);
            return;
        }

        // FIXME HACK, Just hard code the dash len
        let dashLen = dashPattern[segmentNum % dashPattern.length] / zoom;

        ctx.moveTo(x1, y1);

        let dX = x2 - x1;
        let dY = y2 - y1;
        let dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
        let dashX = dX / dashes;
        let dashY = dY / dashes;

        let q = 0;
        while (q++ < dashes) {
            x1 += dashX;
            y1 += dashY;
            ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
        }
        ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
    };

    draw(disp, ctx, zoom, pan) {
        let isPolygon = DispFactory.type(disp) == DispType.polygon;

        let fillColor = isPolygon ? DispPolygon.fillColor(disp) : null;
        let lineColor = DispPolygon.lineColor(disp);
        let lineStyle = DispPolygon.lineStyle(disp);

        let dashPattern = null;
        if (lineStyle != null && lineStyle.dashPatternParsed != null)
            dashPattern = lineStyle.dashPatternParsed;

        // Null colors are also not drawn
        fillColor = (fillColor && fillColor.color) ? fillColor : null;
        lineColor = (lineStyle && lineColor && lineColor.color) ? lineColor : null;

        // If there are no colours defined then this is a selectable only shape
        if (!fillColor && !lineColor)
            return;

        let fillDirection = DispPolygon.fillDirection(disp);
        let fillPercentage = DispPolygon.fillPercent(disp);

        let points = DispPolygon.geom(disp);

        let firstPointX = points[0]; // get details of point
        let firstPointY = points[1]; // get details of point

        // Fill the background first, if required
        if (lineColor && lineStyle.backgroundFillDashSpace && dashPattern) {
            ctx.beginPath();
            ctx.moveTo(firstPointX, firstPointY);

            for (let i = 2; i < points.length; i += 2) {
                let pointX = points[i];
                let pointY = points[i + 1];
                ctx.lineTo(pointX, pointY);
            }

            ctx.strokeStyle = this.config.renderer.backgroundColor;
            ctx.lineWidth = DispPolygon.lineWidth(disp) / zoom;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(firstPointX, firstPointY);

        let lastPointX = firstPointX;
        let lastPointY = firstPointY;

        for (let i = 2; i < points.length; i += 2) {
            let pointX = points[i];
            let pointY = points[i + 1];

            // Draw the segment
            this._drawLine(ctx,
                lastPointX, lastPointY, pointX, pointY,
                dashPattern, zoom, i);

            lastPointX = pointX;
            lastPointY = pointY;
        }

        if (isPolygon)
            ctx.closePath();

        if (lineColor) {
            ctx.strokeStyle = lineColor.color;
            ctx.lineWidth = DispPolygon.lineWidth(disp) / zoom;
            ctx.stroke();
        }


        if (fillColor) {
            if (isPolygon && fillDirection != null && fillPercentage != null) {
                this._drawSquarePercentFill(ctx,
                    PeekCanvasBounds.fromGeom(points),
                    fillColor, fillDirection, fillPercentage
                );
            } else {
                ctx.fillStyle = fillColor.color;
                ctx.fill();
            }
        }

    };

    private _drawSquarePercentFill(ctx, bounds,
                                   fillColor,
                                   fillDirection,
                                   fillPercentage) {
        let FILL_TOP_TO_BOTTOM = 0;
        let FILL_BOTTOM_TO_TOP = 1;
        let FILL_RIGHT_TO_LEFT = 2;
        let FILL_LEFT_TO_RIGHT = 3;

        if (fillDirection == FILL_TOP_TO_BOTTOM) {
            bounds.h *= fillPercentage / 100.0;

        } else if (fillDirection == FILL_BOTTOM_TO_TOP) {
            let oldh = bounds.h;
            bounds.h *= fillPercentage / 100.0;
            bounds.y += oldh - bounds.h;

        } else if (fillDirection == FILL_RIGHT_TO_LEFT) {
            let oldw = bounds.w;
            bounds.w *= fillPercentage / 100.0;
            bounds.x += oldw - bounds.w;

        } else if (fillDirection == FILL_LEFT_TO_RIGHT) {
            bounds.w *= fillPercentage / 100.0;

        }

        ctx.fillStyle = fillColor.color;
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

    }

    drawSelected(dispPoly, ctx, zoom, pan) {
        let points = DispPolygon.geom(dispPoly);

        let selectionConfig = this.config.renderer.selection;

        // DRAW THE SELECTED BOX
        let bounds = PeekCanvasBounds.fromGeom(points);

        // Move the selection line a bit away from the object
        let offset = (selectionConfig.width + selectionConfig.lineGap) / zoom;

        let twiceOffset = 2 * offset;
        let x = bounds.x - offset;
        let y = bounds.y - offset;
        let w = bounds.w + twiceOffset;
        let h = bounds.h + twiceOffset;

        ctx.dashedRect(x, y, w, h, selectionConfig.dashLen / zoom);
        ctx.strokeStyle = selectionConfig.color;
        ctx.lineWidth = selectionConfig.width / zoom;
        ctx.stroke();

        // DRAW THE EDIT HANDLES
        ctx.fillStyle = this.config.editor.selectionHighlightColor;
        let handles = this.handles(dispPoly);
        for (let handle of handles) {
            ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
        }
    }

    /** Contains
     @param x: x and y are mouse coordinates
     @param y:
     @param margin: is the tolerance,

     @returns boolean: True if x and y are on this display object
     */
    contains(dispPoly, x: number, y: number, margin: number): boolean {
        let points = DispPolygon.geom(dispPoly);

        if (!PeekCanvasBounds.fromGeom(points).contains(x, y, margin))
            return false;

        if (DispFactory.type(dispPoly) == DispType.polygon)
            return this.polygonContains(points, dispPoly, x, y, margin);

        return this.polylineContains(points, dispPoly, x, y, margin);
    }

    private polygonContains(points: PointsT, dispPoly,
                            x: number, y: number, margin: number): boolean {


        // Using the polygon line segment crossing algorithm.
        function rayCrossesSegment(axIn: number, ayIn: number,
                                   bxIn: number, byIn: number) {
            let swap = ayIn > byIn;
            let ax = swap ? bxIn : axIn;
            let ay = swap ? byIn : ayIn;
            let bx = swap ? axIn : bxIn;
            let by = swap ? ayIn : byIn;

            // alter longitude to cater for 180 degree crossings
            // JJC, I don't think we need this, we're not using spatial references
            /*
            if (x < 0)
                x += 360;
            if (ax < 0)
                ax += 360;
            if (bx < 0)
                bx += 360;
            */

            if (y == ay || y == by) y += 0.00000001;
            if ((y > by || y < ay) || (x > Math.max(ax, bx))) return false;
            if (x < Math.min(ax, bx)) return true;

            let red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
            let blue = (ax != x) ? ((y - ay) / (x - ax)) : Infinity;
            return (blue >= red);
        }

        let crossings = 0;

        let pFirstX = points[0];
        let pFirstY = points[1];
        let p1x = pFirstX;
        let p1y = pFirstY;

        // This will deliberatly run one more iteration after the last pointY
        for (let i = 2; i <= points.length; i += 2) {
            // Assume this is the last iteration by default
            let p2x = pFirstX;
            let p2y = pFirstY;

            // If not, set it to the proper point.
            if (i != points.length) {
                p2x = points[i];
                p2y = points[i + 1];
            }

            if (rayCrossesSegment(p1x, p1y, p2x, p2y))
                crossings++;

            p1x = p2x;
            p1y = p2y;
        }

        // odd number of crossings?
        return (crossings % 2 == 1);

    }

    private xxx(): boolean {
        function rayCrossesSegment(point, a, b) {
            let px = point.x;
            let py = point.y;
            let swap = a.y > b.y;
            let ax = swap ? b.x : a.x;
            let ay = swap ? b.y : a.y;
            let bx = swap ? a.x : b.x;
            let by = swap ? a.y : b.y;

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

            let red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
            let blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
            return (blue >= red);
        }

        let crossings = 0;

        // let p1 = {x: self.left, y: self.top};
        // for (let i = 0; i <= self.points.length; ++i) {
        //     let thisPoint = self.points[i];
        //     let p2 = (i == self.points.length)
        //             ? {x: self.left, y: self.top} // The closing point
        //             : thisPoint.disp(self);
        //
        //     if (rayCrossesSegment({x: x, y: y}, p1, p2))
        //         crossings++;
        //
        //     p1 = p2;
        // }

        // odd number of crossings?
        return (crossings % 2 == 1);


    }


    private polylineContains(points: PointsT, dispPoly,
                             x: number, y: number, margin: number): boolean {

        // ELSE, POLYLINE
        let x1 = points[0];
        let y1 = points[1];
        for (let i = 2; i < points.length; i += 2) {
            let x2 = points[i];
            let y2 = points[i + 1];


            let dx = x2 - x1;
            let dy = y2 - y1;

            // For Bounding Box
            let left = (x1 < x2 ? x1 : x2) - margin;
            let right = (x1 < x2 ? x2 : x1) + margin;
            let top = (y1 < y2 ? y1 : y2) - margin;
            let bottom = (y1 < y2 ? y2 : y1) + margin;

            // Special condition for vertical lines
            if (dx == 0) {
                if (left <= x && x <= right && top <= y && y <= bottom) {
                    return true;
                }
            }

            let slope = dy / dx;
            // y = mx + c
            // intercept c = y - mx
            let intercept = y1 - slope * x1; // which is same as y2 - slope * x2

            let yVal = slope * x + intercept;
            let xVal = (y - intercept) / slope;

            if (((y - margin) < yVal && yVal < (y + margin)
                || (x - margin) < xVal && xVal < (x + margin))
                && (left <= x && x <= right && top <= y && y <= bottom))
                return true;

            x1 = x2;
            y1 = y2;
        }

        return false;

    }

    withIn(dispPoly, x, y, w, h) {
        return false;
    }

    handles(dispPoly) {
        let result = [];

        let MARG = this.config.editor.resizeHandleMargin;
        let WID = this.config.editor.resizeHandleWidth;
        let HALF_WID = WID / 2.0;

        let points = DispPolyline.geom(dispPoly);

        function addHandle(p, ref) {
            let adj = (p.x - ref.x);
            let opp = (p.y - ref.y);
            let hypot = Math.sqrt(Math.pow(adj, 2) + Math.pow(opp, 2));

            let multiplier = (WID + MARG) / hypot;

            result.push(new PeekCanvasBounds(p.x + adj * multiplier - HALF_WID,
                p.y + opp * multiplier - HALF_WID,
                WID,
                WID));
        }

        function coordForPoint(index: number) {
            index *= 2;
            return {x: points[index], y: points[index + 1]};
        }


        //function rotatePoint(point, theta) {
        //    // Rotates the given polygon which consists of corners represented as (x,y),
        //    // around the ORIGIN, clock-wise, theta degrees
        //    let simTheta = Math.sin(theta);
        //    let cosTheta = Math.cos(theta);
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
        //    let AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
        //    let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        //    let AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
        //    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
        //}

        let firstXy = {x: points[0], y: points[1]};
        addHandle(coordForPoint(0), coordForPoint(1));

        let lastXy = firstXy;
        for (let i = 1; i < points.length / 2; ++i) {
            let thisXy = coordForPoint(i);
            let refXy = lastXy;
            if (i + 2 < points.length / 2) {
                let nextXy = coordForPoint(i + 1);

                //let angle = findAngle(lastXy, thisXy, nextXy);
                //refXy = rotatePoint({x:lastXy.x - this.left, y:lastXy.y - this.top}, angle / 2);

                refXy.x = (lastXy.x + nextXy.x) / 2;
                refXy.y = (lastXy.y + nextXy.y) / 2;
            }
            addHandle(thisXy, refXy);
        }

        return result;
    }

    deltaMove(dispPoly, dx, dy) {
    }

    area(dispPoly) {
        return 0;
    }
}
