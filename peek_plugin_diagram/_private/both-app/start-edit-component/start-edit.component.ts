import {Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {EditorContextType, PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";


export abstract class StartEditComponentBase extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    isContextShown: boolean = false;

    constructor() {
        super();

    }

    ngOnInit() {
        this.canvasEditor.contextPanelObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((val: EditorContextType) => {
                if (val == EditorContextType.NONE) {
                    this.closePopup();
                    return;
                }

                this.openPopup();

            });
    }

    protected openPopup() {
        this.isContextShown = true;
        this.platformOpen();
    }

    protected abstract platformOpen(): void;

    protected abstract platformClose(): void;

    // --------------------
    //

    closePopup(): void {
        this.isContextShown = false;
        this.platformClose();
    }


}
