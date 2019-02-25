import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramBranchService} from "@peek/peek_plugin_diagram/DiagramBranchService";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";
import {
    BranchTuple,
    PrivateDiagramBranchContext
} from "@peek/peek_plugin_diagram/_private/branch";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasInputEditSelectDelegate} from "./PeekCanvasInputEditSelectDelegate.web";
import {PeekCanvasInputSelectDelegate} from "./PeekCanvasInputSelectDelegate.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";

export enum EditorContextType {
    NONE,
    SHAPE_PROPERTIES,
    DYNAMIC_PROPERTIES
}

export enum EditorToolType {
    NONE,
    SELECT_TOOL,
}

/**
 * Peek Canvas Editor
 *
 * This class is the central controller for Edit support.
 *
 */
export class PeekCanvasEditor {


    private branchService: PrivateDiagramBranchService;

    private currentBranch: PrivateDiagramBranchContext | null = null;

    private currentContext: EditorContextType = EditorContextType.NONE;
    private currentTool: EditorToolType = EditorToolType.SELECT_TOOL;

    private _contextPanelChangeSubject: Subject<EditorContextType> = new Subject<EditorContextType>();

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private canvasInput: PeekCanvasInput,
                private canvasModel: PeekCanvasModel,
                private canvasConfig: PeekCanvasConfig,
                branchService: DiagramBranchService,
                // private config: PeekCanvasConfig,
                // private gridObservable: GridObservable,
                // private lookupCache: DiagramLookupService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter
    ) {
        this.branchService = <PrivateDiagramBranchService>branchService;

        this.branchService
            .startEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe((branch: PrivateDiagramBranchContext) => {
                this.currentBranch = branch;
                this.currentTool = EditorToolType.SELECT_TOOL;
                this.canvasInput.setDelegate(PeekCanvasInputEditSelectDelegate);
                this.canvasModel.clearSelection();
                this.canvasConfig.editor.active = true;
            });

        this.branchService
            .stopEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => {
                this.currentBranch = null;
                this.currentContext = EditorContextType.NONE;
                this.currentTool = EditorToolType.NONE;
                this.canvasInput.setDelegate(PeekCanvasInputSelectDelegate);
                this.canvasConfig.editor.active = false;
            });

    };

    // ---------------
    // Properties, used by UI mainly

    isEditing(): boolean {
        return this.currentBranch != null;
    }

    contextPanelObservable(): Observable<EditorContextType> {
        return this._contextPanelChangeSubject;
    }

    contextPanelState(): EditorContextType {
        return this.currentContext;
    }

    selectedTool(): EditorToolType {
        return this.currentTool;
    }

    isShapeSelected(): boolean {
        return true;
    }

    // ---------------
    // Methods called by toolbar

    closeEditor() {
        // TODO: Ask the user
        this.branchService.stopEditing();
    }

    save() {
        this.currentBranch.save()
            .then(() => this.balloonMsg.showSuccess("Branch Save Successful"))
            .catch((e) => this.balloonMsg.showError("Failed to save branch\n" + e));
    }


    showShapeProperties() {
        this.currentContext = EditorContextType.SHAPE_PROPERTIES;
        this._contextPanelChangeSubject.next(this.currentContext);
    }

    showDynamicProperties() {
        this.currentContext = EditorContextType.DYNAMIC_PROPERTIES;
        this._contextPanelChangeSubject.next(this.currentContext);
    }

    // ---------------
    // Methods called by Context

    closeContext() {
        this.currentContext = EditorContextType.NONE;
        this._contextPanelChangeSubject.next(this.currentContext);
    }


    // ---------------------------------------------------------------------------------
    // reset
    // ---------------------------------------------------------------------------------
    private reset() {
    };


}