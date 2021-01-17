import { Component, EventEmitter, Input, Output } from "@angular/core"
import { NgLifeCycleEvents } from "@synerty/vortexjs"
import { PeekCanvasEditor } from "../canvas/PeekCanvasEditor.web"
import { EditorToolType } from "../canvas/PeekCanvasEditorToolType.web"
import { PeekCanvasInputEditMakeRectangleDelegate } from "../canvas-input/PeekCanvasInputEditMakeRectangleDelegate.web"
import { PeekCanvasInputEditMakeEllipseDelegate } from "../canvas-input/PeekCanvasInputEditMakeEllipseDelegate.web"
import { PeekCanvasInputEditMakeDispPolygonDelegate } from "../canvas-input/PeekCanvasInputEditMakePolygonDelegate.web"
import { PeekCanvasInputEditMakeDispPolylinDelegate } from "../canvas-input/PeekCanvasInputEditMakePolylineDelegate.web"
import { PeekCanvasInputMakeDispGroupPtrVertexDelegate } from "../canvas-input/PeekCanvasInputEditMakeGroupPtrVertexDelegate.web"
import { PeekCanvasInputMakeDispPolylineEdgeDelegate } from "../canvas-input/PeekCanvasInputMakeDispPolylineEdgeDelegate.web"
import { PeekCanvasInputEditSelectDelegate } from "../canvas-input/PeekCanvasInputEditSelectDelegate.web"
import { PeekCanvasInputEditMakeTextDelegate } from "../canvas-input/PeekCanvasInputEditMakeTextDelegate.web"
import { PeekCanvasInputEditMakeLineWithArrowDelegate } from "../canvas-input/PeekCanvasInputEditMakeLineWithArrowDelegate.web"
import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService"
import { PrivateDiagramToolbarService } from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService"

@Component({
    selector: "pl-diagram-edit-toolbar",
    templateUrl: "edit-toolbar.component.web.html",
    styleUrls: ["edit-toolbar.component.web.scss"]
})
export class EditToolbarComponent extends NgLifeCycleEvents {
    @Output("openPrintPopup")
    openPrintPopupEmitter = new EventEmitter()
    
    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor
    
    otherPluginButtons: DiagramToolButtonI[] = []
    protected toolbarService: PrivateDiagramToolbarService
    
    constructor(private abstractToolbarService: DiagramToolbarService) {
        super()
        
        this.toolbarService = <PrivateDiagramToolbarService>abstractToolbarService
        
        this.otherPluginButtons = this.toolbarService.editToolButtons
        this.toolbarService
            .editToolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.otherPluginButtons = buttons
            })
    }
    
    buttonClicked(btn: DiagramToolButtonI): void {
        if (btn.callback != null) {
            btn.callback()
        }
        else {
            // Expand children?
        }
    }
    
    // --------------------
    // Other Plugin button integrations
    
    isButtonActive(btn: DiagramToolButtonI): boolean {
        if (btn.isActive == null)
            return false
        return btn.isActive()
    }
    
    needsSave(): boolean {
        return this.canvasEditor.branchContext.branchTuple.needsSave
    }
    
    // --------------------
    // EXIT
    
    confirmExitNoSave(): void {
        this.canvasEditor.closeEditor()
    }
    
    printDiagramClicked(): void {
        this.openPrintPopupEmitter.next()
    }
    
    // --------------------
    // PRINT
    
    selectEditSelectTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditSelectDelegate)
    }
    
    // --------------------
    // Edit Select Tool
    
    isEditSelectToolActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_SELECT_TOOL
    }
    
    deleteShape() {
        let delegate = <PeekCanvasInputEditSelectDelegate>
            this.canvasEditor.canvasInput.selectedDelegate()
        
        delegate.deleteSelectedDisps()
    }
    
    // --------------------
    // Delete Shape
    
    isDeleteShapeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.isEditSelectToolActive()
            && this.canvasEditor.canvasModel.selection.selectedDisps().length != 0
    }
    
    undoShape() {
        this.canvasEditor.doUndo()
    }
    
    // --------------------
    // Undo Shape
    
    isUndoShapeActive(): boolean {
        return this.isEditSelectToolActive()
            && this.canvasEditor.branchContext.branchTuple.isUndoPossible
    }
    
    redoShape() {
        this.canvasEditor.doRedo()
    }
    
    // --------------------
    // Redo Shape
    
    isRedoShapeActive(): boolean {
        return this.isEditSelectToolActive()
            && this.canvasEditor.branchContext.branchTuple.isRedoPossible
    }
    
    selectEditMakeTextTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeTextDelegate)
    }
    
    // --------------------
    // Edit Make Text Tool
    
    isEditMakeTextActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_TEXT
    }
    
    selectEditMakeRectangleTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeRectangleDelegate)
    }
    
    // --------------------
    // Edit Make Rectangle Tool
    
    isEditMakeRectangleActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_RECTANGLE
    }
    
    selectEditMakeLineWithArrowTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeLineWithArrowDelegate)
    }
    
    // --------------------
    // Edit Make Rectangle Tool
    
    isEditMakeLineWithArrowActive(): boolean {
        return this.selectedTool() === EditorToolType.EDIT_MAKE_LINE_WITH_ARROW
    }
    
    selectEditMakeEllipseTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeEllipseDelegate)
    }
    
    // --------------------
    // Edit Make Circle, Ellipse, Arc Tool
    
    isEditMakeEllipseActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_CIRCLE_ELLIPSE_ARC
    }
    
    selectEditMakePolygonTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeDispPolygonDelegate)
    }
    
    // --------------------
    // Edit Make Polygon Tool
    
    isEditMakePolygonActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYGON
    }
    
    selectEditMakePolylineTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeDispPolylinDelegate)
    }
    
    // --------------------
    // Edit Make Polyline Tool
    
    isEditMakePolylineActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYLINE
    }
    
    selectEditMakeGroupPtrVertexTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputMakeDispGroupPtrVertexDelegate)
    }
    
    // --------------------
    // Edit Make Group Ptr Vertex Tool
    
    isEditMakeGroupPtrVertexActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_VERTEX
    }
    
    selectEditMakePolylineEdgeTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputMakeDispPolylineEdgeDelegate)
    }
    
    // --------------------
    // Edit Make Group Ptr Edge Tool
    
    isEditMakePolylineEdgeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_POLYLINE_EDGE
    }
    
    private selectedTool(): EditorToolType {
        if (this.canvasEditor == null)
            return EditorToolType.SELECT_TOOL
        
        return this.canvasEditor.selectedTool()
    }
}
