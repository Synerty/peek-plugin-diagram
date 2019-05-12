import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {BranchDetailTuple} from "@peek/peek_plugin_branch";

import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";


@Component({
    selector: 'pl-diagram-branch-detail',
    templateUrl: 'branch-detail.component.web.html',
    styleUrls: ['branch-detail.component.web.scss'],
    moduleId: module.id
})
export class BranchDetailComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("globalBranch")
    globalBranch: BranchDetailTuple;

    @Input("diagramBranch")
    diagramBranch: BranchTuple;

    @Output("close")
    closeEvent = new EventEmitter();

    disps: any[] = [];

    constructor() {
        super();

    }

    ngOnInit() {
        this.disps = this.diagramBranch.disps;
    }

    noDisps(): boolean {
        return this.disps.length == 0;
    }

    closeClicked(): void {
        this.closeEvent.emit();
    }

}
