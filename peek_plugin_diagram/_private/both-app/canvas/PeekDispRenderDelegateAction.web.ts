import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";

export class PeekDispRenderDelegateAction extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }


    draw(disp, ctx, zoom, pan) {

        disp.bounds = PeekCanvasBounds.fromGeom(disp.g);

        return;

        /*
         let fillColor = this._refData.colorForId(dispAction.fc);
         let lineColor = this._refData.colorForId(dispAction.lc);
         let lineWidth = dispAction.w;

         let point = dispAction.g[0];
         let x = point.x;
         let y = point.y;
         let lx = x; // Low x
         let ux = x; // Upper x
         let ly = y; // Low y
         let uy = y; // Upper y

         ctx.beginPath();
         ctx.moveTo(x, y);

         for (let i = 1; i < dispAction.g.length; ++i) {
         // Get the point
         point = dispAction.g[i];
         x = point.x;
         y = point.y;

         // Draw the segment
         ctx.lineTo(x, y);

         // Work out our bounds
         if (x < lx)
         lx = x;
         if (ux < x)
         ux = x;
         if (y < ly)
         ly = y;
         if (uy < y)
         uy = y;
         }

         ctx.closePath();

         if (fillColor) {
         ctx.fillStyle = fillColor.color;
         ctx.fill();
         }

         if (lineColor) {
         ctx.strokeStyle = lineColor.color;
         ctx.lineWidth = lineWidth / zoom;
         ctx.stroke();
         }
         */

        //this._bounds.x = lx;
        //this._bounds.y = ly;
        //this._bounds.w = ux - lx;
        //this._bounds.h = uy - ly;
    };

    drawSelected(disp, ctx, zoom: number, pan) {


        let selectionConfig = this.config.renderer.selection;

        // DRAW THE SELECTED BOX
        let bounds = disp.bounds;

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

        /*
         // DRAW THE EDIT HANDLES
         ctx.fillStyle = CanvasRenderer.SELECTION_COLOR;
         let handles = this.handles();
         for (let i = 0; i < handles.length; ++i) {
         let handle = handles[i];
         ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
         }
         */
    };

    contains(disp, x, y, margin) {
        return disp.bounds.contains(x, y, margin);
    };

    withIn(disp, x, y, w, h) {
        return disp.bounds.withIn(x, y, w, h);
    };

    handles(disp) {
        return [];
    };

    deltaMove(disp, dx, dy) {
    };

    area(disp) {

        return disp.bounds.area();
    };


}