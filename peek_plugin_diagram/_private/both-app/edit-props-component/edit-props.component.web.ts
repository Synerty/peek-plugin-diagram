import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {EditorContextType, PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-edit-props',
    templateUrl: 'edit-props.component.web.html',
    styleUrls: ['edit-props.component.web.scss'],
    moduleId: module.id
})
export class EditPropsComponent extends ComponentLifecycleEventEmitter
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

    platformOpen(): void {
    }

    platformClose(): void {
    }


    isShowingShapePropertiesContext(): boolean {
        return this.canvasEditor.contextPanelState() === EditorContextType.SHAPE_PROPERTIES;
    }

    isShowingDynamicPropertiesContext(): boolean {
        return this.canvasEditor.contextPanelState() === EditorContextType.DYNAMIC_PROPERTIES;
    }


}
