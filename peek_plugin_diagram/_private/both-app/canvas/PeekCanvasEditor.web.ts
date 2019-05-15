import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {
    PrivateDiagramBranchContext,
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/branch";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasInputEditSelectDelegate} from "./PeekCanvasInputEditSelectDelegate.web";
import {PeekCanvasInputSelectDelegate} from "./PeekCanvasInputSelectDelegate.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasShapePropsContext} from "./PeekCanvasShapePropsContext";
import {DispLevel} from "@peek/peek_plugin_diagram/lookups";

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
                private branchService: PrivateDiagramBranchService,
                // private config: PeekCanvasConfig,
                // private gridObservable: GridObservable,
                // private lookupCache: DiagramLookupService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter
    ) {
        this.branchService
            .startEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe((branchContext: PrivateDiagramBranchContext) => {
                if (this.branchContext)
                    this.branchContext.close();

                this.branchContext = branchContext;
                this.branchContext.open(() => {
                    this.canvasModel.compileBranchDisps();
                    this.canvasModel.selection.clearSelection();
                });

                this.canvasInput.setDelegate(PeekCanvasInputEditSelectDelegate, this);
                this.canvasModel.selection.clearSelection();
                this.canvasConfig.editor.active = true;
                this.canvasConfig.setModelNeedsCompiling();
            });

        this.branchService
            .stopEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => {
                if (this.branchContext)
                    this.branchContext.close();

                this.branchContext = null;
                this.currentContext = EditorContextType.NONE;
                this.canvasInput.setDelegate(PeekCanvasInputSelectDelegate);
                this.canvasConfig.editor.active = false;
                this.canvasConfig.setModelNeedsCompiling();
            });

    };


    // ---------------
    // reset
    private reset() {
    };


    // ---------------
    // Getters

    get modelSetId(): null | number {
        let cs = this.canvasConfig.controller.coordSet;
        return cs == null ? null : cs.modelSetId;
    }


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
        if (this._currentBranch != null)
            this._currentBranch.branchTuple.touchUpdateDate();
    }

    // ---------------
    // Branch Context

    get branchContext(): PrivateDiagramBranchContext {
        return this._currentBranch;
    }

    set branchContext(val: PrivateDiagramBranchContext | null) {
        this.canvasConfig.editor.activeBranchTuple = null;
        this._currentBranch = val;
        if (val != null) {
            this.canvasConfig.editor.activeBranchTuple = val.branchTuple;
            this.canvasConfig.setModelNeedsCompiling();
        }
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

    isLevelVisible(level: DispLevel): boolean {
        return level.minZoom <= this.canvasConfig.viewPort.zoom
            && this.canvasConfig.viewPort.zoom <= level.maxZoom;
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


        //
        // // Setup the shape edit context
        // let shapePropsContext = new PeekCanvasShapePropsContext(
        //     this.canvasModel.selection.selectedDisps()[0],
        //     this.lookupService,
        //     this.modelSetId,
        //     this.coordSetId
        // );
        //
        //   DispText.makeShapeContext(shapePropsContext);
        //   this.setShapePropertiesContext(shapePropsContext);

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

}