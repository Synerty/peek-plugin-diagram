import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispBaseT, PointI} from "../tuples/shapes/DispBase";
import {DispFactory} from "../tuples/shapes/DispFactory";

export abstract class PeekDispRenderDelegateABC {

    protected constructor(protected config: PeekCanvasConfig) {

    }

    abstract updateBounds(disp: DispBaseT, zoom: number): void ;

    abstract draw(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) ;

    abstract drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) ;

    abstract drawEditHandles(disp, ctx, zoom: number, pan: PointI) ;

    abstract contains(disp, x, y, margin): boolean;

    abstract withIn(disp, x, y, w, h): boolean ;

    abstract area(disp): number;

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