import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DrawModeE, PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispNull, DispNullT} from "../canvas-shapes/DispNull";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispBaseT, PointI} from "../canvas-shapes/DispBase";

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
    draw(disp: DispNullT, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
    };


    drawSelected(disp, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
    };

    drawEditHandles(disp, ctx, zoom: number, pan: PointI) {

    }

}
