import {Component, Input} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";


@Component({
    selector: 'pl-diagram-edit-props-toolbar',
    templateUrl: 'edit-props-toolbar.component.web.html',
    styleUrls: ['edit-props-toolbar.component.web.scss'],
    moduleId: module.id
})
export class EditPropsToolbarComponent extends ComponentLifecycleEventEmitter {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    constructor() {
        super();

    }


    isToolbarShown(): boolean {
        return this.canvasEditor.isEditing();
    }


    /*


                *ngIf="canvasEditor.isShapeSelected()"
                (click)="canvasEditor.showShapeProperties()"

                *ngIf="canvasEditor.isShapeSelected()"
                (click)="canvasEditor.showDynamicProperties()"

     */

    // Branch Properties
    showBranchProperties(): void {

    }

    isBranchPropertiesActive(): boolean {
        return false;
    }

    // Shape Properties
    showShapeProperties(): void {
        this.canvasEditor.showShapeProperties();
    }

    isShapePropertiesActive(): boolean {
        return false;
    }

    isShapePropertiesShown(): boolean {
        return this.canvasEditor.isShapeSelected();
    }

    // LiveDB Properties
    showLiveDbProperties(): void {
        this.canvasEditor.showDynamicProperties();
    }

    isLiveDbPropertiesActive(): boolean {
        return false;
    }

    isLiveDbPropertiesShown(): boolean {
        return false; //this.canvasEditor.isShapeSelected();
    }

    /*

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
            this.canvasEditor.setInputEditDelegate(PeekCanvasInputEditMakeCircleArcEllipseDelegate);
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

    */
}
