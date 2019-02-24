import {Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";

import {DiagramBranchService} from "@peek/peek_plugin_diagram/DiagramBranchService";
import {DiagramBranchLocation} from "@peek/peek_plugin_diagram/branch/DiagramBranchContext";


export class ToolbarComponentBase extends ComponentLifecycleEventEmitter
    implements OnInit {
    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;


    protected toolbarService: PrivateDiagramToolbarService;
    buttons: DiagramToolButtonI[] = [];

    toolbarIsOpen: boolean = false;

    constructor(private abstractToolbarService: DiagramToolbarService,
                private branchService: DiagramBranchService) {
        super();

        this.toolbarService = <PrivateDiagramToolbarService>abstractToolbarService;

        this.toolbarService
            .toolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.buttons = buttons;
            });

    }

    ngOnInit() {

    }

    buttonClicked(btn: DiagramToolButtonI): void {
        if (btn.callback != null) {
            btn.callback();
        } else {
            // Expand children?
        }

    }

    toggleToolbar(): void {
        this.toolbarIsOpen = !this.toolbarIsOpen;
    }

    showExitDiagramButton(): boolean {
        return this.toolbarService.exitDiagramCallable(this.modelSetKey) != null;
    }

    exitDiagramClicked(): void {
        let callable = this.toolbarService.exitDiagramCallable(this.modelSetKey);
        return callable();
    }

    showEditDiagramButton(): boolean {
        // TODO, Get the coord set and add a field "allowEdits"
        return true;
    }

    editDiagramClicked(): void {
        this.branchService.startEditing(
            this.modelSetKey, this.coordSetKey,
            "TEST BRANCH", DiagramBranchLocation.LocalBranch
        );
    }

    isToolbarEmpty(): boolean {
        return this.buttons.length == 0;
    }


}
