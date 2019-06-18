import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PeekCanvasShapePropsContext} from "./PeekCanvasShapePropsContext";
import {PrivateDiagramLookupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService";
import {PeekCanvasGroupPtrPropsContext} from "./PeekCanvasGroupPtrPropsContext";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";
import {DispGroupPointerT} from "../canvas-shapes/DispGroupPointer";
import {DispBase, DispType} from "../canvas-shapes/DispBase";
import {DispFactory} from "../canvas-shapes/DispFactory";

export enum EditorContextType {
    NONE,
    BRANCH_PROPERTIES,
    GROUP_PTR_PROPERTIES,
    SHAPE_PROPERTIES,
    DYNAMIC_PROPERTIES
}

/**
 * Peek Canvas Editor
 *
 * This class is the central controller for Edit support.
 *
 */
export class PeekCanvasEditorProps {

    private _contextPanelChangeSubject: Subject<EditorContextType>
        = new Subject<EditorContextType>();

    private _contextPanelState: EditorContextType = EditorContextType.NONE;

    // ---------------
    // Shape Props

    private readonly _shapePanelContextSubject
        = new Subject<PeekCanvasShapePropsContext | null>();

    shapePanelContext: PeekCanvasShapePropsContext | null = null;

    // ---------------
    // LiveDB Props

    private readonly _liveDbPanelContextSubject = new Subject<undefined | null>();

    liveDbPanelContext: undefined | null = null;

    // ---------------
    // Group Ptr Props

    private readonly _groupPtrPanelContextSubject
        = new Subject<PeekCanvasGroupPtrPropsContext | null>();

    groupPtrPanelContext: PeekCanvasGroupPtrPropsContext | null = null;

    // ---------------
    // General things

    private modelSetId: number = -1;
    private coordSetId: number = -1;

    constructor(private lookupService: PrivateDiagramLookupService) {

    };

    setCanvasData(modelSetId: number, coordSetId: number): void {
        this.modelSetId = modelSetId;
        this.coordSetId = coordSetId;
    }

    // ---------------
    // Properties, used by UI mainly

    get contextPanelObservable(): Observable<EditorContextType> {
        return this._contextPanelChangeSubject;
    }

    get shapePanelContextObservable(): Observable<PeekCanvasShapePropsContext | null> {
        return this._shapePanelContextSubject;
    }

    get liveDbPanelContextObservable(): Observable<undefined | null> {
        return this._liveDbPanelContextSubject;
    }

    get groupPtrPanelContextObservable(): Observable<PeekCanvasGroupPtrPropsContext | null> {
        return this._groupPtrPanelContextSubject;
    }

    // ---------------
    // Properties, used by UI mainly

    private setContextPanel(newState: EditorContextType): void {
        this._contextPanelState = newState;
        this._contextPanelChangeSubject.next(newState);
    }


    private setShapePanelContextObservable(val: PeekCanvasShapePropsContext | null): void {
        this.shapePanelContext = val;
        this._shapePanelContextSubject.next(val);
    }


    private setGroupPtrPanelContextObservable(val: PeekCanvasGroupPtrPropsContext | null): void {
        if (val == null
            && this._contextPanelState == EditorContextType.GROUP_PTR_PROPERTIES) {
            this.closeContext();
        }
        this.groupPtrPanelContext = val;
        this._groupPtrPanelContextSubject.next(val);
    }

    private setLiveDbPanelContextObservable(): void {
        // this._liveDbPanelContextSubject;
    }

    // ---------------
    // Methods called by toolbar

    showBranchProperties() {
        this.setContextPanel(
            this._contextPanelState == EditorContextType.BRANCH_PROPERTIES
                ? EditorContextType.NONE
                : EditorContextType.BRANCH_PROPERTIES
        );
    }

    showShapeProperties() {
        this.setContextPanel(
            this._contextPanelState == EditorContextType.SHAPE_PROPERTIES
                ? EditorContextType.NONE
                : EditorContextType.SHAPE_PROPERTIES
        );
    }

    showLiveDbProperties() {
        this.setContextPanel(
            this._contextPanelState == EditorContextType.DYNAMIC_PROPERTIES
                ? EditorContextType.NONE
                : EditorContextType.DYNAMIC_PROPERTIES
        );
    }

    showGroupPtrProperties() {
        this.setContextPanel(
            this._contextPanelState == EditorContextType.GROUP_PTR_PROPERTIES
                ? EditorContextType.NONE
                : EditorContextType.GROUP_PTR_PROPERTIES
        );
    }

    // ---------------
    // Methods called by Context

    closeContext() {
        this.setContextPanel(EditorContextType.NONE);
    }

    // ---------------
    // The shape selection has been updated

    /** Set Selected Shapes
     *
     * @param disps
     */
    setSelectedShapes(model: PeekCanvasModel,
                      branchTuple: BranchTuple): void {

        let selectedDisps = model.selection.selectedDisps();

        // SET THE POPUP
        if (selectedDisps.length != 1) {
            if (this._contextPanelState == EditorContextType.SHAPE_PROPERTIES)
                this.closeContext();

            this.setShapePanelContextObservable(null);
            this.setGroupPtrPanelContextObservable(null);
            return;
        }

        let disp = selectedDisps[0];
        let dispGroupPtr = DispBase.typeOf(disp) == DispType.groupPointer
            ? <DispGroupPointerT>disp
            : model.query.dispGroupForDisp(disp);

        // Setup the shape edit context
        let shapePropsContext = new PeekCanvasShapePropsContext(
            disp, this.lookupService, this.modelSetId, this.coordSetId
        );

        DispFactory.wrapper(disp).makeShapeContext(shapePropsContext);
        this.setShapePanelContextObservable(shapePropsContext);


        if (dispGroupPtr == null) {
            this.setGroupPtrPanelContextObservable(null);

        } else {
            let groupPtrPropsContext = new PeekCanvasGroupPtrPropsContext(
                model, dispGroupPtr, this.lookupService, branchTuple
            );

            this.setGroupPtrPanelContextObservable(groupPtrPropsContext);
        }

    }


}