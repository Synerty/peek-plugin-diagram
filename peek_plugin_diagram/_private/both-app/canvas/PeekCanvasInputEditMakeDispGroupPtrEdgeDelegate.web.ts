import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInputMakeDispGroupPtrDelegate} from "./PeekCanvasInputEditMakeDispGroupPtrDelegate.web";
import {PeekCanvasInputDelegateConstructorArgs} from "./PeekCanvasInputDelegate.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputMakeDispGroupPtrEdgeDelegate extends PeekCanvasInputMakeDispGroupPtrDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_EDGE;


    constructor(cargs: PeekCanvasInputDelegateConstructorArgs) {
        super(cargs,
            PeekCanvasInputMakeDispGroupPtrEdgeDelegate.TOOL_NAME);

        this._reset();
    }


}