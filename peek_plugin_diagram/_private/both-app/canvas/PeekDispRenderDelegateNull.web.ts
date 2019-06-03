import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispNull, DispNullT} from "../tuples/shapes/DispNull";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispBaseT, PointI} from "../tuples/shapes/DispBase";

export class PeekDispRenderDelegateNull extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    updateBounds(disp: DispBaseT): void {
        disp.bounds = PeekCanvasBounds.fromGeom(DispNull.geom(disp));
    }

    /** Draw
     *
     * NOTE: The way the text is scaled and drawn must match _calcTextSize(..)
     * in python module DispCompilerTask.py
     */
    draw(disp: DispNullT, ctx, zoom: number, pan: PointI, forEdit: boolean) {
    };


    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
    };

    drawEditHandles(disp, ctx, zoom: number, pan: PointI) {

    }


    contains(disp: DispNullT, x, y, margin) {
        return disp.bounds == null ? false : disp.bounds.contains(x, y, margin);
    };

    withIn(disp: DispNullT, x, y, w, h): boolean {
        return disp.bounds == null ? false : disp.bounds.withIn(x, y, w, h);
    };

    area(disp) {
        return disp.bounds == null ? 0 : disp.bounds.area();
    };

}
