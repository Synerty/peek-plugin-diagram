import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInputEditMakeDispPolyDelegate} from "./PeekCanvasInputEditMakeDispPolyDelegate.web";
import {PeekCanvasInputDelegateConstructorArgs} from "./PeekCanvasInputDelegate.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeDispPolygonDelegate
    extends PeekCanvasInputEditMakeDispPolyDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_POLYGON;


    constructor(cargs: PeekCanvasInputDelegateConstructorArgs) {
        super(cargs, PeekCanvasInputEditMakeDispPolygonDelegate.TOOL_NAME);

        this._reset();
    }

}