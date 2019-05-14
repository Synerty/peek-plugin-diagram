import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {BranchDetailTuple} from "@peek/peek_plugin_branch";

import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";

import {DocDbService, DocumentResultI} from "@peek/peek_plugin_docdb";
import {DispFactory} from "../tuples/shapes/DispFactory";
import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";


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
    globalBranch: BranchDetailTuple;

    @Input("diagramBranch")
    diagramBranch: BranchTuple;

    @Output("close")
    closeEvent = new EventEmitter();

    DETAILS_TAB = 1;
    ANCHORS_TAB = 2;
    EDITED_ITEMS_TAB = 3;
    barIndex: number = 1;

    anchorDocs: any[] = [];

    disps: any[] = [];

    private diagramPosService: PrivateDiagramPositionService;

    constructor(private docDbService: DocDbService,
                diagramPosService: DiagramPositionService) {
        super();

        this.diagramPosService = <PrivateDiagramPositionService>diagramPosService;

    }

    ngOnInit() {
        this.disps = this.diagramBranch.disps;

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

    closeClicked(): void {
        this.closeEvent.emit();
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
