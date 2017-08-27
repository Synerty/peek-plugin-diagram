import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC";
import {DispPolygon} from "../tuples/shapes/DispPolygon";
import {DispFactory, DispType} from "../tuples/shapes/DispFactory";
import {PeekCanvasBounds} from "./PeekCanvasBounds";

export class PeekDispRenderDelegatePoly extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }


    private _drawLine(ctx, x1, y1, x2, y2, lineStyle, zoom) {

        if (lineStyle.dashPattern == null) {
            ctx.lineTo(x2, y2);
            return;
        }

        // FIXME HACK, Just hard code the dash len
        let dashLen = lineStyle.dashPattern[0] / zoom;

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
        if (lineColor && lineStyle.backgroundFillDashSpace) {
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
            this._drawLine(ctx, lastPointX, lastPointY, pointX, pointY, lineStyle, zoom);
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
        let self = this;
        let selectionConfig = this.config.renderer.selection;
        // DRAW THE SELECTED BOX
        let bounds = dispPoly.bounds;

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
    }

    contains(dispPoly, x, y, margin) {
        return false;
    }

    contains_old(dispPoly, x, y, margin) {

        if (!dispPoly.bounds.contains(x, y, margin))
            return false;

        let isPolygon = dispPoly._tt == 'DPG';
        // For PoF, We only want to hittest on connectivity
        if (isPolygon)
            return false;

        // let x, y are mouse coordinates
        // let margin, is the tolerance,

        // let geom is an array, EG [{x:10,y:10}, {x:20,y:10}, {x:20,y:20}, {x:20,y:30}]
        let geom = dispPoly.g;


        /*
         if (isPolygon) {
         // Using the polygon line segment crossing algorithm.
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

         let pFirst = {x: dispPoly.bounds.x, y: dispPoly.bounds.y};
         let p1 = pFirst;
         for (let i = 1; i <= geom.length; ++i) {
         let thisPoint = geom[i];
         let p2 = (i == geom.length)
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
        let x1 = geom[0].x;
        let y1 = geom[0].y;
        for (let i = 1; i < geom.length; ++i) {
            let x2 = geom[i].x;
            let y2 = geom[i].y;


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
        return [];

        /*
         let self = this;
         let result = [];

         let MARG = Renderable.RESIZE_HANDLE_MARGIN;
         let WID = Renderable.RESIZE_HANDLE_WIDTH;
         let HALF_WID = WID / 2.0;

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


         let firstXy = {x: this.left, y: this.top};
         addHandle(firstXy, this.points[0].coord(self));

         let lastXy = firstXy;
         for (let i = 0; i < this.points.length; ++i) {
         let thisXy = this.points[i].coord(self);
         let refXy = lastXy;
         if (i + 1 < this.points.length) {
         let nextXy = this.points[i + 1].coord(self);

         //let angle = findAngle(lastXy, thisXy, nextXy);
         //refXy = rotatePoint({x:lastXy.x - this.left, y:lastXy.y - this.top}, angle / 2);

         refXy.x = (lastXy.x + nextXy.x) / 2;
         refXy.y = (lastXy.y + nextXy.y) / 2;
         }
         addHandle(thisXy, refXy);
         }

         return result;
         */
    }

    deltaMove(dispPoly, dx, dy) {
    }

    area(dispPoly) {
        return 0;
    }
}
