import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC";
import {DispEllipse} from "../tuples/shapes/DispEllipse";

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
    };

    drawSelected(dispEllipse, ctx, zoom) {
    };

    contains(dispEllipse, x, y, margin) {
        return false;
    };

    withIn(dispEllipse, x, y, w, h) {
        return false;
    };

    handles(dispEllipse) {
        return [];
    };

    deltaMove(dispEllipse, dx, dy) {
    };

    area(dispEllipse) {

        return dispEllipse.bounds.area();
    };


}