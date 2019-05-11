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
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch";


@Component({
    selector: 'pl-diagram-select-branches',
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

    enabledBranches: { [branchKey: string]: BranchDetailTuple } = {}


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
            .subscribe((v: PopupLayerSelectionArgsI) => this.openPopup(v));

    }

    ngOnInit() {

    }

    protected openPopup({coordSetKey, modelSetKey}) {
        // let coordSet = this.coordSetService.coordSetForKey(coordSetKey);
        console.log("Opening Branch Select popup");

        this.globalBranchService.branches(this.modelSetKey)
            .then((tuples: BranchDetailTuple[]) => {
                this.items = tuples;
                for (let item of tuples) {
                    item["__enabled"] = this.enabledBranches[item.key] != null;
                }
            });
        this.items = [];

        this.popupShown = true;
        this.platformOpen();
    }

    closePopup(): void {
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


}
