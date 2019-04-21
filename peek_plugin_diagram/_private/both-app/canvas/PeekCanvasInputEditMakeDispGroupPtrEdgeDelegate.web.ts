import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInputMakeDispGroupPtrDelegate} from "./PeekCanvasInputEditMakeDispGroupPtrDelegate.web";
import {InputDelegateConstructorArgs} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputMakeDispGroupPtrEdgeDelegate extends PeekCanvasInputMakeDispGroupPtrDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_EDGE;


    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor,
            PeekCanvasInputMakeDispGroupPtrEdgeDelegate.TOOL_NAME);

        this._reset();
    }


}