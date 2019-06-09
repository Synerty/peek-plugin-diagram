import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
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
import {DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {PeekCanvasEditorProps} from "./PeekCanvasEditorProps";

/**
 * Peek Canvas Editor
 *
 * This class is the central controller for Edit support.
 *
 */
export class PeekCanvasEditor {


    private _currentBranch: PrivateDiagramBranchContext | null = null;

    private readonly _props: PeekCanvasEditorProps;

    constructor(public balloonMsg: Ng2BalloonMsgService,
                public canvasInput: PeekCanvasInput,
                public canvasModel: PeekCanvasModel,
                private canvasConfig: PeekCanvasConfig,
                public lookupService: DiagramLookupService,
                private branchService: PrivateDiagramBranchService,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter) {
        this.branchService
            .startEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe((branchContext: PrivateDiagramBranchContext) => {
                this._props.setCanvasData(this.modelSetId, this.coordSetId);

                if (this.branchContext)
                    this.branchContext.close();

                this.branchContext = branchContext;

                this.branchContext
                    .branchUpdatedObservable
                    .takeUntil(this.lifecycleEventEmitter.onDestroyEvent)
                    .subscribe((modelUpdateRequired: boolean) => {
                        if (modelUpdateRequired) {
                            this.canvasModel.recompileModel();
                            this.canvasModel.selection.clearSelection();
                            this.setEditorSelectTool();
                        }
                    });

                this.branchContext.open();

                this.canvasInput.setDelegate(PeekCanvasInputEditSelectDelegate, this);
                this.canvasModel.selection.clearSelection();
                this.canvasConfig.editor.active = true;
                this.canvasConfig.updateEditedBranch(branchContext.branchTuple.key);
                this.canvasConfig.setModelNeedsCompiling();
            });

        this.branchService
            .stopEditingObservable
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => {
                if (this.branchContext)
                    this.branchContext.close();

                this.branchContext = null;
                this.props.closeContext();
                this.canvasInput.setDelegate(PeekCanvasInputSelectDelegate);
                this.canvasConfig.editor.active = false;
                this.canvasModel.selection.clearSelection();
                this.canvasConfig.setModelNeedsCompiling();
            });

        this._props = new PeekCanvasEditorProps(this.lookupService);

        this.canvasModel.selection.selectionChangedObservable()
            .takeUntil(lifecycleEventEmitter.onDestroyEvent)
            .subscribe(() => {
                if (!this.canvasConfig.editor.active)
                    return;
                this._props.setSelectedShapes(
                    this.canvasModel, this._currentBranch.branchTuple
                )
            });
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

    get props(): PeekCanvasEditorProps {
        return this._props;
    }

    // ---------------
    // Shape Props

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

    selectedTool(): EditorToolType {
        return this.canvasInput.selectedDelegateType();
    }

    isShapeSelected(): boolean {
        return true;
    }

    isLevelVisible(level: DispLevel): boolean {
        return level.minZoom <= this.canvasConfig.viewPort.zoom
            && this.canvasConfig.viewPort.zoom <= level.maxZoom;
    }

    setEditorSelectTool(): void {
        this.setInputEditDelegate(PeekCanvasInputEditSelectDelegate);
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

}