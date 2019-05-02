import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {DiagramBranchService} from "@peek/peek_plugin_diagram/DiagramBranchService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {DispLayer} from "@peek/peek_plugin_diagram/lookups";

import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {
    PopupEditBranchSelectionArgs,
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";
import {DiagramBranchLocation} from "@peek/peek_plugin_diagram/branch/DiagramBranchContext";


@Component({
    selector: 'pl-diagram-start-edit',
    templateUrl: 'start-edit.component.web.html',
    styleUrls: ['start-edit.component.web.scss'],
    moduleId: module.id
})
export class StartEditComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';
    popupShown: boolean = false;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    private branchService: PrivateDiagramBranchService;
    private coordSetService: PrivateDiagramCoordSetService;


    items: DispLayer[] = [];


    constructor(abstractBranchService: DiagramBranchService,
                abstractCoordSetService: DiagramCoordSetService) {
        super();

        this.branchService = <PrivateDiagramBranchService>abstractBranchService;
        this.coordSetService = <PrivateDiagramCoordSetService>abstractCoordSetService;

        this.branchService
            .popupEditBranchSelectionObservable
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: PopupEditBranchSelectionArgs) => this.openPopup(v));

    }

    ngOnInit() {

    }

    protected openPopup({coordSetKey, modelSetKey}) {
        let coordSet = this.coordSetService.coordSetForKey(coordSetKey);
        console.log("Opening Layer Select popup");

        this.items = [];

        this.popupShown = true;
        this.platformOpen();
    }


    // --------------------
    //

    closePopup(): void {
        this.popupShown = false;
        this.platformClose();

        // Discard the integration additions
        this.items = [];
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


    noItems(): boolean {
        return this.items.length == 0;
    }

    startEditing(): void {
        this.branchService.startEditing(
            this.modelSetKey, this.coordSetKey, 'defaultBranchKey',
            DiagramBranchLocation.LocalBranch
        );
        this.closePopup();
    }


}
