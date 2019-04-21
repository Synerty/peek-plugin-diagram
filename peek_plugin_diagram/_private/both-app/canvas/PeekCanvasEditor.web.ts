import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DiagramBranchService} from "@peek/peek_plugin_diagram/DiagramBranchService";
import {PrivateDiagramBranchContext, PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasInputEditSelectDelegate} from "./PeekCanvasInputEditSelectDelegate.web";
import {PeekCanvasInputSelectDelegate} from "./PeekCanvasInputSelectDelegate.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasShapePropsContext} from "./shape-props/PeekCanvasShapePropsContext";

export enum EditorContextType {
    NONE,
    SHAPE_PROPERTIES,
    DYNAMIC_PROPERTIES
}

/**
 * Peek Canvas Editor
 *
 * This class is the central controller for Edit support.
 *
 */
export class PeekCanvasEditor {


    private branchService: PrivateDiagramBranchService;

    private _currentBranch: PrivateDiagramBranchContext | null = null;

    private currentContext: EditorContextType = EditorContextType.NONE;

    private _contextPanelChangeSubject: Subject<EditorContextType>
        = new Subject<EditorContextType>();

    private _shapePanelContextSubject: Subject<PeekCanvasShapePropsContext>
        = new Subject<PeekCanvasShapePropsContext>();
    private _shapePanelContext: PeekCanvasShapePropsContext
        = new PeekCanvasShapePropsContext();

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private canvasInput: PeekCanvasInput,
                private canvasModel: PeekCanvasModel,
                private canvasConfig: PeekCanvasConfig,
                public lookupService: DiagramLookupService,
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
                this._currentBranch = branch;
                this.canvasInput.setDelegate(PeekCanvasInputEditSelectDelegate);
                this.canvasModel.clearSelection();
                this.canvasConfig.editor.active = true;
            });

        this.branchService
            .stopEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => {
                this._currentBranch = null;
                this.currentContext = EditorContextType.NONE;
                this.canvasInput.setDelegate(PeekCanvasInputSelectDelegate);
                this.canvasConfig.editor.active = false;
            });

    };

    get coordSetId(): null | number {
        let cs = this.canvasConfig.controller.coordSet;
        return cs == null ? null : cs.id;
    }

    // ---------------
    // Shape Props


    shapePanelContextObservable(): Observable<PeekCanvasShapePropsContext> {
        return this._shapePanelContextSubject;
    }

    shapePanelContext(): PeekCanvasShapePropsContext {
        return this._shapePanelContext;
    }

    setShapePropertiesContext(context: PeekCanvasShapePropsContext) {
        this.showShapeProperties();
        this._shapePanelContext = context;
        this._shapePanelContextSubject.next(context);
    }

    dispPropsUpdated(): void {
        this.canvasConfig.invalidate();
    }

    // ---------------
    // Branch Context

    branchContext(): PrivateDiagramBranchContext {
        return this._currentBranch;
    }

    // ---------------
    // Properties, used by UI mainly

    isEditing(): boolean {
        return this._currentBranch != null;
    }

    contextPanelObservable(): Observable<EditorContextType> {
        return this._contextPanelChangeSubject;
    }

    contextPanelState(): EditorContextType {
        return this.currentContext;
    }

    selectedTool(): EditorToolType {
        return this.canvasInput.selectedDelegate();
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
        this._currentBranch.save()
            .then(() => this.balloonMsg.showSuccess("Branch Save Successful"))
            .catch((e) => this.balloonMsg.showError("Failed to save branch\n" + e));
    }


    setInputEditDelegate(Delegate) {
        this.canvasInput.setDelegate(Delegate, this);
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