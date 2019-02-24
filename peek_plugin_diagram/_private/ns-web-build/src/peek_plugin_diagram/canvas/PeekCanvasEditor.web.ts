import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramBranchService} from "@peek/peek_plugin_diagram/plugin-module/DiagramBranchService";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";
import {PrivateDiagramBranchContext} from "@peek/peek_plugin_diagram/_private/branch";

/**
 * Peek Canvas Editor
 *
 * This class is the central controller for Edit support.
 *
 */

export class PeekCanvasEditor {

    private branchService: PrivateDiagramBranchService;

    private currentBranch: PrivateDiagramBranchContext | null = null;

    constructor(branchService: DiagramBranchService,
                // private config: PeekCanvasConfig,
                // private gridObservable: GridObservable,
                // private lookupCache: DiagramLookupService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter
    ) {
        this.branchService = <PrivateDiagramBranchService>branchService;

        this.branchService
            .startEditingObservable
            .takeUntil(lifecycleEventEmitter)
            .subscribe((branch: PrivateDiagramBranchContext) => {
                this.currentBranch = branch;
            });

        this.branchService
            .stopEditingObservable
            .takeUntil(lifecycleEventEmitter)
            .subscribe((branch: PrivateDiagramBranchContext) => {
                this.currentBranch = null;
            });

    };

    isEditing(): boolean {
        return this.currentBranch != null;
    }


    // ---------------------------------------------------------------------------------
    // reset
    // ---------------------------------------------------------------------------------
    private reset() {
    };


}