import {Component, EventEmitter, Input, Output} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {EditorToolType} from "../canvas/PeekCanvasEditorToolType.web";
import {PeekCanvasInputEditMakeRectangleDelegate} from "../canvas-input/PeekCanvasInputEditMakeRectangleDelegate.web";
import {PeekCanvasInputEditMakeEllipseDelegate} from "../canvas-input/PeekCanvasInputEditMakeEllipseDelegate.web";
import {PeekCanvasInputEditMakeDispPolygonDelegate} from "../canvas-input/PeekCanvasInputEditMakePolygonDelegate.web";
import {PeekCanvasInputEditMakeDispPolylinDelegate} from "../canvas-input/PeekCanvasInputEditMakePolylineDelegate.web";
import {PeekCanvasInputMakeDispGroupPtrVertexDelegate} from "../canvas-input/PeekCanvasInputEditMakeGroupPtrVertexDelegate.web";
import {PeekCanvasInputMakeDispPolylineEdgeDelegate} from "../canvas-input/PeekCanvasInputMakeDispPolylineEdgeDelegate.web";
import {PeekCanvasInputEditSelectDelegate} from "../canvas-input/PeekCanvasInputEditSelectDelegate.web";
import {PeekCanvasInputEditMakeTextDelegate} from "../canvas-input/PeekCanvasInputEditMakeTextDelegate.web";
import {PeekCanvasInputEditMakeLineWithArrowDelegate} from "../canvas-input/PeekCanvasInputEditMakeLineWithArrowDelegate.web";
import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";

@Component({
    selector: 'pl-diagram-edit-toolbar',
    templateUrl: 'edit-toolbar.component.web.html',
    styleUrls: ['edit-toolbar.component.web.scss'],
    moduleId: module.id
})
export class EditToolbarComponent extends ComponentLifecycleEventEmitter {


    @Output('openPrintPopup')
    openPrintPopupEmitter = new EventEmitter();

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    protected toolbarService: PrivateDiagramToolbarService;

    otherPluginButtons: DiagramToolButtonI[] = [];

    constructor(private abstractToolbarService: DiagramToolbarService) {
        super();

        this.toolbarService = <PrivateDiagramToolbarService>abstractToolbarService;

        this.otherPluginButtons = this.toolbarService.editToolButtons;
        this.toolbarService
            .editToolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.otherPluginButtons = buttons;
            });

    }


    private selectedTool(): EditorToolType {
        if (this.canvasEditor == null)
            return EditorToolType.SELECT_TOOL;

        return this.canvasEditor.selectedTool();
    }

    // --------------------
    // Other Plugin button integrations

    buttonClicked(btn: DiagramToolButtonI): void {
        if (btn.callback != null) {
            btn.callback();
        } else {
            // Expand children?
        }
    }

    isButtonActive(btn: DiagramToolButtonI): boolean {
        if (btn.isActive == null)
            return false;
        return btn.isActive();
    }

    // --------------------
    // EXIT

    needsSave(): boolean {
        return this.canvasEditor.branchContext.branchTuple.needsSave;
    }

    confirmExitNoSave(): void {
        this.canvasEditor.closeEditor();
    }

    // --------------------
    // PRINT

    printDiagramClicked(): void {
        this.openPrintPopupEmitter.next();
    }

    // --------------------
    // Edit Select Tool

    selectEditSelectTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditSelectDelegate);
    }

    isEditSelectToolActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_SELECT_TOOL;
    }

    // --------------------
    // Delete Shape

    deleteShape() {
        let delegate = <PeekCanvasInputEditSelectDelegate>
            this.canvasEditor.canvasInput.selectedDelegate();

        delegate.deleteSelectedDisps();
    }

    isDeleteShapeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.isEditSelectToolActive()
            && this.canvasEditor.canvasModel.selection.selectedDisps().length != 0;
    }

    // --------------------
    // Undo Shape

    undoShape() {
        this.canvasEditor.doUndo();
    }

    isUndoShapeActive(): boolean {
        return this.isEditSelectToolActive()
            && this.canvasEditor.branchContext.branchTuple.isUndoPossible;
    }

    // --------------------
    // Redo Shape

    redoShape() {
        this.canvasEditor.doRedo();
    }

    isRedoShapeActive(): boolean {
        return this.isEditSelectToolActive()
            && this.canvasEditor.branchContext.branchTuple.isRedoPossible;
    }


    // --------------------
    // Edit Make Text Tool

    selectEditMakeTextTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeTextDelegate);
    }

    isEditMakeTextActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_TEXT;
    }

    // --------------------
    // Edit Make Rectangle Tool

    selectEditMakeRectangleTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeRectangleDelegate);
    }

    isEditMakeRectangleActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_RECTANGLE;
    }

    // --------------------
    // Edit Make Rectangle Tool

    selectEditMakeLineWithArrowTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeLineWithArrowDelegate);
    }

    isEditMakeLineWithArrowActive(): boolean {
        return this.selectedTool() === EditorToolType.EDIT_MAKE_LINE_WITH_ARROW;
    }

    // --------------------
    // Edit Make Circle, Ellipse, Arc Tool

    selectEditMakeEllipseTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeEllipseDelegate);
    }

    isEditMakeEllipseActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_CIRCLE_ELLIPSE_ARC;
    }

    // --------------------
    // Edit Make Polygon Tool

    selectEditMakePolygonTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeDispPolygonDelegate);
    }

    isEditMakePolygonActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYGON;
    }

    // --------------------
    // Edit Make Polyline Tool

    selectEditMakePolylineTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeDispPolylinDelegate);
    }

    isEditMakePolylineActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYLINE;
    }


    // --------------------
    // Edit Make Group Ptr Vertex Tool

    selectEditMakeGroupPtrVertexTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputMakeDispGroupPtrVertexDelegate);
    }

    isEditMakeGroupPtrVertexActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_VERTEX;
    }


    // --------------------
    // Edit Make Group Ptr Edge Tool

    selectEditMakePolylineEdgeTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputMakeDispPolylineEdgeDelegate);
    }

    isEditMakePolylineEdgeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_POLYLINE_EDGE;
    }


}
