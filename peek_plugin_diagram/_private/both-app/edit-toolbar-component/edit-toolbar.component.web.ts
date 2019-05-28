import {Component, Input} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {EditorToolType} from "../canvas/PeekCanvasEditorToolType.web";
import {PeekCanvasInputEditMakeRectangleDelegate} from "../canvas/PeekCanvasInputEditMakeRectangleDelegate.web";
import {PeekCanvasInputEditMakeEllipseDelegate} from "../canvas/PeekCanvasInputEditMakeEllipseDelegate.web";
import {PeekCanvasInputEditMakeDispPolygonDelegate} from "../canvas/PeekCanvasInputEditMakePolygonDelegate.web";
import {PeekCanvasInputEditMakeDispPolylinDelegate} from "../canvas/PeekCanvasInputEditMakePolylineDelegate.web";
import {PeekCanvasInputMakeDispGroupPtrVertexDelegate} from "../canvas/PeekCanvasInputEditMakeGroupPtrVertexDelegate.web";
import {PeekCanvasInputMakeDispGroupPtrEdgeDelegate} from "../canvas/PeekCanvasInputEditMakeGroupPtrEdgeDelegate.web";
import {PeekCanvasInputEditSelectDelegate} from "../canvas/PeekCanvasInputEditSelectDelegate.web";
import {PeekCanvasInputEditMakeTextDelegate} from "../canvas/PeekCanvasInputEditMakeTextDelegate.web";


@Component({
    selector: 'pl-diagram-edit-toolbar',
    templateUrl: 'edit-toolbar.component.web.html',
    styleUrls: ['edit-toolbar.component.web.scss'],
    moduleId: module.id
})
export class EditToolbarComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    constructor() {
        super();

    }


    private selectedTool(): EditorToolType {
        if (this.canvasEditor == null)
            return EditorToolType.SELECT_TOOL;
        return this.canvasEditor.selectedTool();
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
        let disps = this.canvasEditor.canvasModel.selection.selectedDisps();
        this.canvasEditor.canvasModel.selection.clearSelection();
        this.canvasEditor.branchContext.branchTuple.removeDisps(disps);
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

    selectEditMakeGroupPtrEdgeTool() {
        this.canvasEditor.setInputEditDelegate(PeekCanvasInputMakeDispGroupPtrEdgeDelegate);
    }

    isEditMakeGroupPtrEdgeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_EDGE;
    }


}
