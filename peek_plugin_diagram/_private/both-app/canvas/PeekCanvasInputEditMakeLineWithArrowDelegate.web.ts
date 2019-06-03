import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInputEditMakeDispPolyDelegate} from "./PeekCanvasInputEditMakePolyDelegate.web";
import {InputDelegateConstructorArgs} from "./PeekCanvasInputDelegate.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";

/**
 * This input delegate handles :
 * Zooming (touch and mouse)
 * Panning (touch and mouse)
 * Selecting at a point (touch and mouse)
 *
 */
export class PeekCanvasInputEditMakeLineWithArrowDelegate
    extends PeekCanvasInputEditMakeDispPolyDelegate {
    static readonly TOOL_NAME = EditorToolType.EDIT_MAKE_LINE_WITH_ARROW;


    constructor(viewArgs: InputDelegateConstructorArgs,
                canvasEditor: PeekCanvasEditor) {
        super(viewArgs, canvasEditor, PeekCanvasInputEditMakeLineWithArrowDelegate.TOOL_NAME);

        this._reset();
    }

}