import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PointI} from "../tuples/shapes/DispBase";

export class PeekDispRenderDelegateAction extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }


    draw(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {

        disp.bounds = PeekCanvasBounds.fromGeom(disp.g);

        if (!forEdit)
            return;

        let drawCfg = this.config.renderer.invisible;
        let b = disp.bounds;

        // Move the selection line a bit away from the object
        let offset = (drawCfg.width + drawCfg.lineGap) / zoom;

        ctx.dashedRect(b.x, b.y, b.w, b.h, drawCfg.dashLen / zoom);
        ctx.strokeStyle = drawCfg.color;
        ctx.lineWidth = drawCfg.width / zoom;
        ctx.stroke();
    };

    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {

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


        if (forEdit) {
            /*
             // DRAW THE EDIT HANDLES
             ctx.fillStyle = CanvasRenderer.SELECTION_COLOR;
             let handles = this.handles();
             for (let i = 0; i < handles.length; ++i) {
             let handle = handles[i];
             ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
             }
             */
        }
    };

    contains(disp, x, y, margin) {
        return disp.bounds.contains(x, y, margin);
    }
    ;

    withIn(disp, x, y, w, h) {
        return disp.bounds.withIn(x, y, w, h);
    }
    ;

    handles(disp) {
        return [];
    }
    ;

    area(disp) {

        return disp.bounds.area();
    }
    ;


}