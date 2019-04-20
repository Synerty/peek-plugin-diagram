import {MousePos, PeekCanvasInputDelegate} from "./PeekCanvasInputDelegate.web";
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
export class PeekCanvasInputEditMakeDispPolygonDelegate
    extends PeekCanvasInputEditMakeDispPolyDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_POLYGON;


    constructor(canvasInput: PeekCanvasInput,
                config: PeekCanvasConfig,
                model: PeekCanvasModel,
                dispDelegate: PeekDispRenderFactory) {
        super(canvasInput, config, model, dispDelegate,
            PeekCanvasInputEditMakeDispPolygonDelegate.TOOL_NAME);

        this._reset();
    }

}