import {PeekCanvasConfig} from "./PeekCanvasConfig";

export abstract class PeekDispRenderDelegateABC {

    constructor(protected config: PeekCanvasConfig) {

    }

    abstract draw(dispAction, ctx, zoom, pan) ;

    abstract drawSelected(actObj, ctx, zoom, pan) ;

    abstract contains(actObj, x, y, margin) ;

    abstract withIn(actObj, x, y, w, h) ;

    abstract handles(actObj);

    abstract deltaMove(actObj, dx, dy) ;

    abstract area(actObj);


}