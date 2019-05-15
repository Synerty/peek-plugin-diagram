import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds";

export abstract class PeekDispRenderDelegateABC {

    constructor(protected config: PeekCanvasConfig) {

    }

    abstract draw(disp, ctx, zoom, pan): void;

    abstract drawSelected(disp, ctx, zoom:number, pan): void;

    abstract drawSelectedForEdit(disp, ctx, zoom:number, pan): void;

    abstract contains(disp, x, y, margin): boolean;

    abstract withIn(disp, x, y, w, h): boolean ;

    abstract handles(disp): PeekCanvasBounds[];

    abstract deltaMove(disp, dx, dy): void;

    abstract area(disp): number;


}