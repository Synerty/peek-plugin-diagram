import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {EditorContextType, PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-start-edit',
    templateUrl: 'start-edit.component.web.html',
    styleUrls: ['start-edit.component.web.scss'],
    moduleId: module.id
})
export class StartEditComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    isContextShown: boolean = false;

    @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';

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


    // --------------------
    //

    closePopup(): void {
        this.isContextShown = false;
        this.platformClose();
    }

    platformOpen(): void {
        // .modal is defined in bootstraps code
        let jqModal: any = $(this.modalView.nativeElement);

        jqModal.modal({
            backdrop: 'static',
            keyboard: false
        });

        // Move the backdrop
        let element = $(this.backdropId).detach();
        jqModal.parent().append(element);
    }

    platformClose(): void {
        let jqModal: any = $(this.modalView.nativeElement);
        jqModal.modal('hide');
    }


}
