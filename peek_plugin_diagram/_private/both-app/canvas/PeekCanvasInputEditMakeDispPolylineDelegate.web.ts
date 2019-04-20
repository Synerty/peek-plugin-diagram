import {MousePos} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInputEditMakeDispPolyDelegate} from "./PeekCanvasInputEditMakeDispPolyDelegate.web";

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


    constructor(canvasInput: PeekCanvasInput,
                config: PeekCanvasConfig,
                model: PeekCanvasModel,
                dispDelegate: PeekDispRenderFactory) {
        super(canvasInput, config, model, dispDelegate,
            PeekCanvasInputEditMakeDispPolylinDelegate.TOOL_NAME);

        this._reset();
    }

}