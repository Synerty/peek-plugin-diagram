import {Component, Input, OnInit} from "@angular/core";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";

import {PrivateDiagramConfigService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.web.html',
    styleUrls: ['toolbar.component.web.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ComponentLifecycleEventEmitter
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
                private branchService: PrivateDiagramBranchService,
                private configService: PrivateDiagramConfigService) {
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
        this.branchService.popupEditBranchSelection(this.modelSetKey, this.coordSetKey);
    }

    selectBranchesClicked(): void {
        this.configService.popupBranchesSelection(this.modelSetKey, this.coordSetKey);
    }

    selectLayersClicked(): void {
        this.configService.popupLayerSelection(this.modelSetKey, this.coordSetKey);
    }

    isToolbarEmpty(): boolean {
        return this.buttons.length == 0;
    }


}
