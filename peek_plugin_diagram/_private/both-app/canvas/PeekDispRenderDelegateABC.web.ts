import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PointI} from "../tuples/shapes/DispBase";

export abstract class PeekDispRenderDelegateABC {

    protected constructor(protected config: PeekCanvasConfig) {

    }

    abstract draw(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) ;

    abstract drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) ;

    abstract contains(disp, x, y, margin): boolean;

    abstract withIn(disp, x, y, w, h): boolean ;

    abstract handles(disp): PeekCanvasBounds[];

    abstract area(disp): number;


}