import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";

import {PrivateDiagramConfigService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples";


@Component({
    selector: 'pl-diagram-view-toolbar',
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

    @Input("config")
    config: PeekCanvasConfig;

    @Output('openPrintPopup')
    openPrintPopupEmitter = new EventEmitter();

    coordSet: ModelCoordSet = new ModelCoordSet();

    protected toolbarService: PrivateDiagramToolbarService;

    private parentPluginButtons: DiagramToolButtonI[][] = [];
    shownPluginButtons: DiagramToolButtonI[] = [];

    toolbarIsOpen: boolean = false;

    constructor(private abstractToolbarService: DiagramToolbarService,
                private branchService: PrivateDiagramBranchService,
                private configService: PrivateDiagramConfigService) {
        super();

        this.toolbarService = <PrivateDiagramToolbarService>abstractToolbarService;

        this.shownPluginButtons = this.toolbarService.toolButtons;
        this.parentPluginButtons = [];
        this.toolbarService
            .toolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.shownPluginButtons = buttons;
                this.parentPluginButtons = [];
            });

    }

    ngOnInit() {

        if (this.config.coordSet != null)
            this.coordSet = this.config.coordSet;

        this.config.controller.coordSetChange
            .takeUntil(this.onDestroyEvent)
            .subscribe((cs) => this.coordSet = cs);

    }

    buttonClicked(btn: DiagramToolButtonI): void {
        if (btn.callback != null) {
            btn.callback();
        } else if (btn.children == null && btn.children.length != 0) {
            this.parentPluginButtons.push(this.shownPluginButtons);
            this.shownPluginButtons = btn.children;
        } else {
            // ??
        }

    }

    isButtonActive(btn: DiagramToolButtonI): boolean {
        if (btn.isActive == null)
            return false;
        return btn.isActive();
    }

    toggleToolbar(): void {
        this.toolbarIsOpen = !this.toolbarIsOpen;
    }

    showSelectBranchesButton(): boolean {
        return this.coordSet.branchesEnabled == true;
    }

    showExitDiagramButton(): boolean {
        return this.toolbarService.exitDiagramCallable(this.modelSetKey) != null;
    }

    exitDiagramClicked(): void {
        let callable = this.toolbarService.exitDiagramCallable(this.modelSetKey);
        return callable();
    }

    showEditDiagramButton(): boolean {
        return this.coordSet.editEnabled == true
            && this.coordSet.editDefaultLayerId != null
            && this.coordSet.editDefaultLevelId != null
            && this.coordSet.editDefaultColorId != null
            && this.coordSet.editDefaultLineStyleId != null
            && this.coordSet.editDefaultTextStyleId != null;
    }

    editDiagramClicked(): void {
        this.branchService.popupEditBranchSelection(this.modelSetKey, this.coordSetKey);
    }

    printDiagramClicked(): void {
        this.openPrintPopupEmitter.next();
    }

    selectBranchesClicked(): void {
        this.configService.popupBranchesSelection(this.modelSetKey, this.coordSetKey);
    }

    selectLayersClicked(): void {
        this.configService.popupLayerSelection(this.modelSetKey, this.coordSetKey);
    }

    showGoUpParentButton(): boolean {
        return this.parentPluginButtons.length != 0;
    }

    goUpParentButtonClicked(): void {
        this.shownPluginButtons = this.parentPluginButtons.pop();
    }

    isToolbarEmpty(): boolean {
        return this.shownPluginButtons.length == 0;
    }


}
