import {Component, Input} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../../canvas/PeekCanvasEditor.web";
import {EditorToolType} from "../../canvas/PeekCanvasEditorToolType.web";
import {PeekCanvasInputSelectDelegate} from "../../canvas/PeekCanvasInputSelectDelegate.web";
import {PeekCanvasInputEditMakeTextDelegate} from "../../canvas/PeekCanvasInputEditMakeTextDelegate.web";
import {PeekCanvasInput} from "../../canvas/PeekCanvasInput.web";
import {PeekCanvasInputEditMakeRectangleDelegate} from "../../canvas/PeekCanvasInputEditMakeRectangleDelegate.web";
import {PeekCanvasInputEditMakeCircleArcEllipseDelegate} from "../../canvas/PeekCanvasInputEditMakeEllipseDelegate.web";
import {PeekCanvasInputEditMakeDispPolygonDelegate} from "../../canvas/PeekCanvasInputEditMakeDispPolygonDelegate.web";
import {PeekCanvasInputEditMakeDispPolylinDelegate} from "../../canvas/PeekCanvasInputEditMakeDispPolylineDelegate.web";
import {PeekCanvasInputMakeDispGroupPtrVertexDelegate} from "../../canvas/PeekCanvasInputEditMakeDispGroupPtrVertexDelegate.web";
import {PeekCanvasInputMakeDispGroupPtrEdgeDelegate} from "../../canvas/PeekCanvasInputEditMakeDispGroupPtrEdgeDelegate.web";


@Component({
    selector: 'pl-diagram-edit-toolbar',
    templateUrl: 'edit-toolbar.component.web.html',
    styleUrls: ['edit-toolbar.component.web.scss'],
    moduleId: module.id
})
export class EditToolbarComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    @Input("canvasInput")
    canvasInput: PeekCanvasInput;

    constructor() {
        super();

    }


    private selectedTool(): EditorToolType {
        if (this.canvasInput == null)
            return EditorToolType.SELECT_TOOL;
        return this.canvasInput.selectedDelegate();
    }

    // --------------------
    // Edit Select Tool

    selectEditSelectTool() {
        this.canvasInput.setDelegate(PeekCanvasInputSelectDelegate);
    }

    isEditSelectToolActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_SELECT_TOOL;
    }

    // --------------------
    // Edit Make Text Tool

    selectEditMakeTextTool() {
        this.canvasInput.setDelegate(PeekCanvasInputEditMakeTextDelegate);
    }

    isEditMakeTextActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_TEXT;
    }

    // --------------------
    // Edit Make Rectangle Tool

    selectEditMakeRectangleTool() {
        this.canvasInput.setDelegate(PeekCanvasInputEditMakeRectangleDelegate);
    }

    isEditMakeRectangleActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_RECTANGLE;
    }

    // --------------------
    // Edit Make Circle, Ellipse, Arc Tool

    selectEditMakeEllipseTool() {
        this.canvasInput.setDelegate(PeekCanvasInputEditMakeCircleArcEllipseDelegate);
    }

    isEditMakeEllipseActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_CIRCLE_ELLIPSE_ARC;
    }

    // --------------------
    // Edit Make Polygon Tool

    selectEditMakePolygonTool() {
        this.canvasInput.setDelegate(PeekCanvasInputEditMakeDispPolygonDelegate);
    }

    isEditMakePolygonActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYGON;
    }

    // --------------------
    // Edit Make Polyline Tool

    selectEditMakePolylineTool() {
        this.canvasInput.setDelegate(PeekCanvasInputEditMakeDispPolylinDelegate);
    }

    isEditMakePolylineActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_POLYLINE;
    }


    // --------------------
    // Edit Make Group Ptr Vertex Tool

    selectEditMakeGroupPtrVertexTool() {
        this.canvasInput.setDelegate(PeekCanvasInputMakeDispGroupPtrVertexDelegate);
    }

    isEditMakeGroupPtrVertexActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_VERTEX;
    }


    // --------------------
    // Edit Make Group Ptr Edge Tool

    selectEditMakeGroupPtrEdgeTool() {
        this.canvasInput.setDelegate(PeekCanvasInputMakeDispGroupPtrEdgeDelegate);
    }

    isEditMakeGroupPtrEdgeActive(): boolean {
        // console.log(`Tool=${this.selectedTool()}`);
        return this.selectedTool() === EditorToolType.EDIT_MAKE_DISP_GROUP_PTR_EDGE;
    }


}
