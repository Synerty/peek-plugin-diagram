import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";
import {BranchDetailTuple, BranchService} from "@peek/peek_plugin_branch";


import {
    PopupLayerSelectionArgsI,
    PrivateDiagramConfigService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";

import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";
import {
    BranchTuple,
    PrivateDiagramBranchContext,
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/branch";


@Component({
    selector: 'pl-diagram-view-select-branches',
    templateUrl: 'select-branches.component.web.html',
    styleUrls: ['select-branches.component.web.scss'],
    moduleId: module.id
})
export class SelectBranchesComponent extends ComponentLifecycleEventEmitter
    implements OnInit {
    @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';
    popupShown: boolean = false;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    @Input("config")
    config: PeekCanvasConfig;

    private coordSetService: PrivateDiagramCoordSetService;

    items: BranchDetailTuple[] = [];

    enabledBranches: { [branchKey: string]: BranchDetailTuple } = {};

    selectedGlobalBranch: BranchDetailTuple | null = null;
    selectedDiagramBranch: BranchTuple | null = null;


    constructor(private titleService: TitleService,
                private lookupService: DiagramLookupService,
                private configService: PrivateDiagramConfigService,
                private branchService: PrivateDiagramBranchService,
                abstractCoordSetService: DiagramCoordSetService,
                private globalBranchService: BranchService) {
        super();

        this.coordSetService = <PrivateDiagramCoordSetService>abstractCoordSetService;

        this.configService
            .popupBranchesSelectionObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => this.openPopup());

    }

    ngOnInit() {

    }

    protected openPopup() {
        let coordSet = this.coordSetService
            .coordSetForKey(this.modelSetKey, this.coordSetKey);
        console.log("Opening Branch Select popup");

        // Get a list of existing diagram branches, if there are no matching diagram
        // branches, then don't show them
        let diagramKeys = this.branchService.getDiagramBranchKeys(coordSet.id);
        let diagramKeyDict = {};
        for (let key of diagramKeys) {
            diagramKeyDict[key] = true;
        }

        this.globalBranchService.branches(this.modelSetKey)
            .then((tuples: BranchDetailTuple[]) => {
                this.items = [];
                for (let item of tuples) {
                    if (diagramKeyDict[item.key] == null)
                        continue;
                    this.items.push(item);
                    item["__enabled"] = this.enabledBranches[item.key] != null;
                }
            });
        this.items = [];

        this.popupShown = true;
        this.platformOpen();
    }

    closePopup(): void {
        if (this.showBranchDetails()) {
            this.clearBranchDetails();
            return;
        }

        let branches = [];
        for (let key of Object.keys(this.enabledBranches)) {
            branches.push(this.enabledBranches[key]);
        }
        this.branchService.setVisibleBranches(branches);
        this.config.setModelNeedsCompiling();

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

    toggleEnabled(branchDetail: BranchDetailTuple): void {
        if (this.enabledBranches[branchDetail.key] == null) {
            this.enabledBranches[branchDetail.key] = branchDetail;
            branchDetail["__enabled"] = true;
        } else {
            delete this.enabledBranches[branchDetail.key];
            branchDetail["__enabled"] = false;
        }
    }

    branchSelected(branchDetail: BranchDetailTuple): void {
        this.selectedGlobalBranch = branchDetail;
        this.selectedDiagramBranch = null;

        if (branchDetail == null)
            return;

        this.branchService
            .getBranch(this.modelSetKey, this.coordSetKey, branchDetail.key)
            .then((diagramBranch: PrivateDiagramBranchContext) => {

                this.selectedDiagramBranch = diagramBranch.branchTuple;
            });
    }


    clearBranchDetails(): void {
        this.selectedGlobalBranch = null;
        this.selectedDiagramBranch = null;
    }


    showBranchDetails(): boolean {
        return this.selectedGlobalBranch != null && this.selectedDiagramBranch != null;
    }

}
