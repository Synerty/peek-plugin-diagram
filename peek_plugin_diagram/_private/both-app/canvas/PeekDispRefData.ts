import {PeekCanvasConfig} from "./PeekCanvasConfig";
/** Peek Canvas Coord Tuple
 *
 * This class is an extension of the Coord Tuple, that allows it to be rendered by the
 * canvas.
 */

export class PeekDispRefData {
    // ============================================================================
    // PeekDispRefData
    // ============================================================================
    constructor(private config: PeekCanvasConfig) {
    }

    textStyleForId(textStyleId) {
        return peekModelCache.textStyleForId(textStyleId);
    };


    colorForId(colorId) {
        return peekModelCache.colorForId(colorId);
    };


    layerForId(layerId) {
        return peekModelCache.layerForId(layerId);
    };


    levelForId(levelId) {
        return peekModelCache.levelForId(levelId);
    };


    lineStyleForId(lineStyleId) {
        return peekModelCache.lineStyleForId(lineStyleId);
    };

}