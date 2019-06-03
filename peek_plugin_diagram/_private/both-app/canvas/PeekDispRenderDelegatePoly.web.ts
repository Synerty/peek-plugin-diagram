import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispPolygon} from "../tuples/shapes/DispPolygon";
import {DispBase, DispBaseT, DispType, PointI, PointsT} from "../tuples/shapes/DispBase";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispTextT} from "../tuples/shapes/DispText";
import {DispPolyline, DispPolylineEndTypeE} from "../tuples/shapes/DispPolyline";

export class PeekDispRenderDelegatePoly extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    updateBounds(disp: DispBaseT): void {
        let geom = DispPolygon.geom(disp);
        disp.bounds = PeekCanvasBounds.fromGeom(geom);
    }


    private _drawLine(ctx, x1: number, y1: number, x2: number, y2: number,
                      dashPattern: null | number[],
                      zoom: number, segmentNum: number) {

        if (dashPattern == null) {
            ctx.lineTo(x2, y2);
            return;
        }

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

    draw(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        let isPolygon = DispBase.typeOf(disp) == DispType.polygon;

        let fillColor = isPolygon ? DispPolygon.fillColor(disp) : null;
        let lineColor = DispPolygon.lineColor(disp);
        let lineStyle = DispPolygon.lineStyle(disp);
        let lineWidth = DispPolygon.lineWidth(disp);

        let dashPattern = null;
        if (lineStyle != null && lineStyle.dashPatternParsed != null)
            dashPattern = lineStyle.dashPatternParsed;

        // Null colors are also not drawn
        fillColor = (fillColor && fillColor.color) ? fillColor : null;
        lineColor = (lineStyle && lineColor && lineColor.color) ? lineColor : null;

        let geom = DispPolygon.geom(disp);

        // If there are no colours defined then this is a selectable only shape
        if (!fillColor && !lineColor)
            return;

        let fillDirection = DispPolygon.fillDirection(disp);
        let fillPercentage = DispPolygon.fillPercent(disp);

        let firstPointX = geom[0]; // get details of point
        let firstPointY = geom[1]; // get details of point

        // Fill the background first, if required
        if (lineColor && lineStyle.backgroundFillDashSpace && dashPattern) {
            ctx.beginPath();
            ctx.moveTo(firstPointX, firstPointY);

            for (let i = 2; i < geom.length; i += 2) {
                let pointX = geom[i];
                let pointY = geom[i + 1];
                ctx.lineTo(pointX, pointY);
            }

            ctx.strokeStyle = this.config.renderer.backgroundColor;
            ctx.lineWidth = lineWidth / zoom;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(firstPointX, firstPointY);

        let lastPointX = firstPointX;
        let lastPointY = firstPointY;

        for (let i = 2; i < geom.length; i += 2) {
            let pointX = geom[i];
            let pointY = geom[i + 1];

            // Draw the segment
            this._drawLine(ctx,
                lastPointX, lastPointY, pointX, pointY,
                dashPattern, zoom, i / 2);

            lastPointX = pointX;
            lastPointY = pointY;
        }

        if (isPolygon) {
            if (lastPointX != firstPointX || lastPointY != firstPointY) {
                this._drawLine(ctx,
                    lastPointX, lastPointY, firstPointX, firstPointY,
                    dashPattern, zoom, geom.length);
            }
            ctx.closePath();
        }

        if (lineColor) {
            ctx.strokeStyle = lineColor.color;
            ctx.lineWidth = lineWidth / zoom;
            ctx.stroke();
        }


        if (fillColor) {
            if (isPolygon && fillDirection != null && fillPercentage != null) {
                this._drawSquarePercentFill(ctx,
                    PeekCanvasBounds.fromGeom(geom),
                    lineColor, fillDirection, fillPercentage
                );
            } else {
                ctx.fillStyle = fillColor.color;
                ctx.fill();
            }
        }


        // Draw the line ends
        if (!isPolygon && 4 <= geom.length) {
            this.drawPolyLineEnd(ctx, lineWidth / zoom, lineColor,
                geom[2], geom[3], geom[0], geom[1],
                DispPolyline.startEndType(disp));

            let l = geom.length - 2;
            this.drawPolyLineEnd(ctx, lineWidth / zoom, lineColor,
                geom[l - 2], geom[l - 1], geom[l], geom[l + 1],
                DispPolyline.endEndType(disp));
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

    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        let geom = DispPolygon.geom(disp);

        let selectionConfig = this.config.renderer.selection;

        // DRAW THE SELECTED BOX
        let bounds = PeekCanvasBounds.fromGeom(geom);

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

    drawEditHandles(disp, ctx, zoom: number, pan: PointI) {
        // DRAW THE EDIT HANDLES
        ctx.fillStyle = this.config.editor.selectionHighlightColor;
        let handles = this.handles(disp);
        for (let handle of handles) {
            ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
        }

    }

    private drawPolyLineEnd(ctx, lineWidth: number, lineColor,
                            fromX: number, fromY: number, toX: number, toY: number,
                            endType: DispPolylineEndTypeE): void {
        if (endType == DispPolylineEndTypeE.None || lineColor == null || !lineWidth)
            return;

        if (endType == DispPolylineEndTypeE.Dot) {
            let size = lineWidth * 3;
            ctx.beginPath();
            ctx.arc(toX, toY, size, 0, 2 * Math.PI);
            ctx.fillStyle = lineColor.color;
            ctx.fill();
            return;
        }

        if (endType == DispPolylineEndTypeE.Arrow) {
            let radians = Math.atan((fromY - toY) / (fromX - toX));
            radians += ((fromX >= toX) ? -90 : 90) * Math.PI / 180;

            let halfWidth = lineWidth * 3;
            let length = lineWidth * 12;

            ctx.save();
            ctx.translate(toX, toY);
            ctx.rotate(radians);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(halfWidth, length);
            ctx.lineTo(-halfWidth, length);
            ctx.closePath();

            ctx.fillStyle = lineColor.color;
            ctx.fill();

            ctx.restore();
            return;
        }

        throw new Error(`Unhandled line ending: ${endType}`);

    }

    /** Contains
     @param x: x and y are mouse coordinates
     @param y:
     @param margin: is the tolerance,

     @returns boolean: True if x and y are on this display object
     */
    contains(dispPoly, x: number, y: number, margin: number): boolean {
        let geom = DispPolygon.geom(dispPoly);

        if (!PeekCanvasBounds.fromGeom(geom).contains(x, y, margin))
            return false;

        if (DispBase.typeOf(dispPoly) == DispType.polygon)
            return this.polygonContains(geom, dispPoly, x, y, margin);

        return this.polylineContains(geom, dispPoly, x, y, margin);
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

        // This will deliberately run one more iteration after the last pointY
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

    withIn(disp: DispTextT, x, y, w, h): boolean {
        return disp.bounds == null ? false : disp.bounds.withIn(x, y, w, h);
    };

    area(disp) {
        return disp.bounds == null ? 0 : disp.bounds.area();
    };
}
