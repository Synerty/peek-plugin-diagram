import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
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
export class PeekCanvasInputEditMakeDispPolylinDelegate
    extends PeekCanvasInputEditMakeDispPolyDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_POLYLINE;


    constructor(cargs: PeekCanvasInputDelegateConstructorArgs) {
        super(cargs, PeekCanvasInputEditMakeDispPolylinDelegate.TOOL_NAME);

        this._reset();
    }

}