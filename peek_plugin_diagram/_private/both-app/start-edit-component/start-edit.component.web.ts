import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {BranchDetailTuple, BranchService} from "@peek/peek_plugin_branch";

import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {
    PopupEditBranchSelectionArgs,
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";

import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {UserService} from "@peek/peek_core_user";


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

    private coordSetService: PrivateDiagramCoordSetService;


    items: BranchDetailTuple[] = [];

    NEW_TAB = 1;
    EXISTING_TAB = 2;
    barIndex: number = 1;

    selectedBranch: BranchDetailTuple = null;
    newBranch: BranchDetailTuple = new BranchDetailTuple();


    constructor(private branchService: PrivateDiagramBranchService,
                abstractCoordSetService: DiagramCoordSetService,
                private globalBranchService: BranchService,
                private balloonMsg: Ng2BalloonMsgService,
                private userService: UserService) {
        super();

        this.coordSetService = <PrivateDiagramCoordSetService>abstractCoordSetService;


        this.branchService
            .popupEditBranchSelectionObservable
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: PopupEditBranchSelectionArgs) => this.openPopup(v));

    }

    ngOnInit() {

    }

    protected openPopup({coordSetKey, modelSetKey}) {
        const userDetail = this.userService.userDetails;

        this.newBranch = new BranchDetailTuple();
        this.newBranch.modelSetKey = this.modelSetKey;
        this.newBranch.createdDate = new Date();
        this.newBranch.updatedDate = new Date();
        this.newBranch.userName = userDetail.userName;

        // let coordSet = this.coordSetService.coordSetForKey(coordSetKey);
        console.log("Opening Start Edit popup");

        this.globalBranchService.branches(this.modelSetKey)
            .then((tuples: BranchDetailTuple[]) => {
                this.items = tuples;
            })
            .catch((e) => `Failed to load branches ${e}`);

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

    isBranchSelected(item: BranchDetailTuple): boolean {
        return item != null && this.selectedBranch != null && item.id == this.selectedBranch.id;
    }

    selectBranch(item: BranchDetailTuple): void {
        this.selectedBranch = item;
    }

    startEditing() {

        if (this.barIndex == this.NEW_TAB) {
            let nb = this.newBranch;
            if (nb.name == null || nb.name.length == 0) {
                this.balloonMsg.showWarning("Name must be supplied to create a branch");
                return;
            }

            nb.key = `${nb.userName}|${nb.createdDate.getTime()}|${nb.name}`;

            this.globalBranchService.createBranch(nb)
                .catch(e => this.balloonMsg.showError(`Failed to create branch : ${e}`));

        }

        let branchToEdit = this.barIndex == this.NEW_TAB ? this.newBranch : this.selectedBranch;

        this.branchService.startEditing(
            this.modelSetKey, this.coordSetKey, branchToEdit.key
        );
        this.closePopup();
    }


}
