import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {BranchDetailTuple, BranchService} from "@peek/peek_plugin_branch";

import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";

import {DocDbService, DocumentResultI} from "@peek/peek_plugin_docdb";
import {DispFactory} from "../tuples/shapes/DispFactory";
import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {PrivateDiagramBranchContext} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchContext";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";


@Component({
    selector: 'pl-diagram-branch-detail',
    templateUrl: 'branch-detail.component.web.html',
    styleUrls: ['branch-detail.component.web.scss'],
    moduleId: module.id
})
export class BranchDetailComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("modelSetKey")
    modelSetKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("globalBranch")
    inputGlobalBranch: BranchDetailTuple;

    @Input("globalBranchKey")
    globalBranchKey: string;

    globalBranch: BranchDetailTuple;

    diagramBranch: BranchTuple;

    DETAILS_TAB = 1;
    ANCHORS_TAB = 2;
    EDITED_ITEMS_TAB = 3;
    barIndex: number = 1;

    anchorDocs: any[] = [];

    disps: any[] = [];

    private diagramPosService: PrivateDiagramPositionService;

    constructor(private docDbService: DocDbService,
                diagramPosService: DiagramPositionService,
                private branchService: PrivateDiagramBranchService,
                private globalBranchService: BranchService) {
        super();

        this.diagramPosService = <PrivateDiagramPositionService>diagramPosService;

    }

    ngOnInit() {
        if (this.inputGlobalBranch != null) {
            this.globalBranch = this.inputGlobalBranch;
            this.globalBranchKey = this.inputGlobalBranch.key;
            this.loadData();
            return;
        }

        this.globalBranchService.getBranch(this.modelSetKey, this.globalBranchKey)
            .then((globalBranch: BranchDetailTuple | null) => {
                if (globalBranch == null) {
                    console.log(`ERROR: Could not load global branch for ${this.globalBranchKey}`);
                    return;
                }
                this.globalBranch = globalBranch;
                this.loadData();
            })
    }

    private loadData() {

        this.branchService
            .getBranch(this.modelSetKey, this.coordSetKey, this.globalBranchKey)
            .then((diagramBranch: PrivateDiagramBranchContext) => {
                this.diagramBranch = diagramBranch.branchTuple;
                this.disps = this.diagramBranch.disps;
                this.loadAnchorKeys();
            });
    }

    private loadAnchorKeys() {

        this.docDbService
            .getObjects(this.modelSetKey, this.diagramBranch.anchorDispKeys)
            .then((docs: DocumentResultI) => {
                this.anchorDocs = [];

                for (let anchorDispKey of this.diagramBranch.anchorDispKeys) {
                    let doc = docs[anchorDispKey];
                    let props = [{title: "Key", value: anchorDispKey}];
                    if (doc != null) {
                        props.add(this.docDbService.getNiceOrderedProperties(doc))
                    }
                    this.anchorDocs.push(props);
                }
            });
    }

    noAnchors(): boolean {
        return this.anchorDocs.length == 0;
    }

    noDisps(): boolean {
        return this.disps.length == 0;
    }

    dispDesc(disp): string[] {
        return DispFactory.wrapper(disp).makeShapeStr(disp).split('\n');
    }

    positonAnchorOnDiagram(props: any[]): void {
        this.diagramPosService.positionByKey(this.modelSetKey, props[0].value, this.coordSetKey);
    }

    positonDispOnDiagram(disp: any): void {
        let Wrapper = DispFactory.wrapper(disp);
        let center = Wrapper.center(disp);

        this.diagramPosService.position(
            this.coordSetKey, center.x, center.y, 1.0, Wrapper.key(disp)
        );
    }

}
