import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispNull, DispNullT} from "../tuples/shapes/DispNull";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PointI} from "../tuples/shapes/DispBase";

export class PeekDispRenderDelegateNull extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    /** Draw
     *
     * NOTE: The way the text is scaled and drawn must match _calcTextSize(..)
     * in python module DispCompilerTask.py
     */
    draw(disp: DispNullT, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        disp.bounds = PeekCanvasBounds.fromGeom(DispNull.geom(disp));
    };


    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
    };


    contains(disp: DispNullT, x, y, margin) {
        return disp.bounds == null ? false : disp.bounds.contains(x, y, margin);
    };

    withIn(disp: DispNullT, x, y, w, h): boolean {
        return disp.bounds == null ? false : disp.bounds.withIn(x, y, w, h);
    };

    handles(disp: DispNullT): PeekCanvasBounds[] {
        return [];
    };

    area(disp) {
        return disp.bounds == null ? 0 : disp.bounds.area();
    };

}
