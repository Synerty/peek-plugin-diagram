import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispEllipse} from "../tuples/shapes/DispEllipse";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispTextT} from "../tuples/shapes/DispText";

export class PeekDispRenderDelegateEllipse extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }


    draw(disp, ctx, zoom: number) {

        let fillColor = DispEllipse.fillColor(disp);
        let lineColor = DispEllipse.lineColor(disp);

        // Null colors are also not drawn
        fillColor = (fillColor && fillColor.color) ? fillColor : null;
        lineColor = (lineColor && lineColor.color) ? lineColor : null;

        let xRadius = DispEllipse.xRadius(disp);
        let yRadius = DispEllipse.yRadius(disp);
        let rotationRadian = DispEllipse.rotation(disp) / 180.0 * Math.PI;
        let startAngle = DispEllipse.startAngle(disp);
        let endAngle = DispEllipse.endAngle(disp);
        let lineWidth = DispEllipse.lineWidth(disp);

        let yScale = yRadius / xRadius;

        let centerX = DispEllipse.centerPointX(disp);
        let centerY = DispEllipse.centerPointY(disp);

        // save state
        ctx.save();
        ctx.translate(DispEllipse.centerPointX(disp), DispEllipse.centerPointY(disp));
        ctx.scale(1, yScale);
        ctx.rotate(rotationRadian);

        let startRadian = startAngle / 180.0 * Math.PI;
        let endRadian = endAngle / 180.0 * Math.PI;

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
        disp.bounds = new PeekCanvasBounds(
            centerX - xRadius,
            centerY - yRadius,
            2 * xRadius,
            2 * yRadius
        );
    };

    drawSelected(disp, ctx, zoom, pan) {
        let bounds = disp.bounds;
        if (bounds == null)
            return;

        // DRAW THE SELECTED BOX
        let selectionConfig = this.config.renderer.selection;

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
    };

    drawSelectedForEdit(disp, ctx, zoom: number, pan) {
        this.drawSelected(disp, ctx, zoom, pan);
    };

    contains(disp: DispTextT, x, y, margin) {
        return disp.bounds == null ? false : disp.bounds.contains(x, y, margin);
    };

    withIn(disp: DispTextT, x, y, w, h): boolean {
        return disp.bounds == null ? false : disp.bounds.withIn(x, y, w, h);
    };

    handles(disp) {
        return [];
    };

    area(disp) {
        return disp.bounds == null ? 0 : disp.bounds.area();
    };


}