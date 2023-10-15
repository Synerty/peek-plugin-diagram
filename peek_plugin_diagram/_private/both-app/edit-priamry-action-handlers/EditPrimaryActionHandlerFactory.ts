import { CanvasInputPos } from "../canvas-input/PeekCanvasInputDelegateUtil.web";
import { DispBase, DispType } from "../canvas-shapes/DispBase";
import { EditPrimaryActionDelegateHandlerText } from "./EditPrimaryActionHandlerDelegateText";
import { EditPrimaryActionHandlerArgsI } from "./EditPrimaryActionHandlerArgsI";
import { PeekCanvasEditor } from "../canvas/PeekCanvasEditor.web";

export class EditPrimaryActionHandlerFactory {
    private readonly delegates = {};
    private canvasEditor: PeekCanvasEditor | null = null;

    constructor(private handlerArgs: EditPrimaryActionHandlerArgsI) {
        this.delegates[DispType.text] = EditPrimaryActionDelegateHandlerText;
    }

    async handlePrimaryAction(disp, position: CanvasInputPos): Promise<void> {
        const Handler = this.delegates[DispBase.typeOf(disp)];

        if (!Handler) {
            console.log(
                `handlePrimaryAction: No handler for` +
                    ` ${DispBase.typeOf(disp)}`
            );
            return;
        }

        await new Handler(
            this.handlerArgs,
            this.canvasEditor
        ).handlePrimaryAction(disp, position);
    }

    setCanvasEditor(editor: PeekCanvasEditor) {
        this.canvasEditor = editor;
    }
}
