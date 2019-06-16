import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispBaseT, PointI} from "../canvas-shapes/DispBase";
import {DispFactory} from "../canvas-shapes/DispFactory";

export enum DrawModeE {
    ForView = 1,
    ForEdit = 2,
    ForSuggestion = 3
}

export abstract class PeekDispRenderDelegateABC {

    protected constructor(protected config: PeekCanvasConfig) {

    }

    abstract updateBounds(disp: DispBaseT, zoom: number): void ;

    abstract draw(disp, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) ;

    abstract drawSelected(disp, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) ;

    abstract drawEditHandles(disp, ctx, zoom: number, pan: PointI) ;

    handles(disp): PeekCanvasBounds[] {
        const margin = this.config.editor.resizeHandleMargin;
        const width = this.config.editor.resizeHandleWidth;

        const handleCenters = DispFactory.wrapper(disp).handlePoints(disp, margin + width);

        const halfWidth = width / 2.0;

        const results: PeekCanvasBounds[] = [];
        for (let p of handleCenters) {
            results.push(
                new PeekCanvasBounds(p.x - halfWidth, p.y - halfWidth, width, width)
            );
        }

        return results;
    }


}