import {Input, NgZone, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";


import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {EditorContextType, PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";


export abstract class EditContextComponentBase extends ComponentLifecycleEventEmitter
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

    title() {
        let lookup = [];
        lookup[EditorContextType.NONE] = "No Panel";
        lookup[EditorContextType.SHAPE_PROPERTIES] = "Shape Properties";
        lookup[EditorContextType.DYNAMIC_PROPERTIES] = "Dynamic Properties";
        return lookup[this.canvasEditor.contextPanelState()];
    }

    protected openPopup() {
        this.isContextShown = true;
        this.platformOpen();
    }

    closePopup(): void {
        this.isContextShown = false;
        this.platformClose();
    }

    protected abstract platformOpen(): void;

    protected abstract platformClose(): void;


    isShowingShapePropertiesContext(): boolean {
        return this.canvasEditor.contextPanelState() === EditorContextType.SHAPE_PROPERTIES;
    }

    isShowingDynamicPropertiesContext(): boolean {
        return this.canvasEditor.contextPanelState() === EditorContextType.DYNAMIC_PROPERTIES;
    }


}
