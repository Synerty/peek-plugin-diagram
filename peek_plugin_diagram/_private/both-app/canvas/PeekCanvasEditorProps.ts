import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PeekCanvasShapePropsContext} from "./PeekCanvasShapePropsContext";
import {DispBaseT} from "../tuples/shapes/DispBase";
import {DispFactory} from "../tuples/shapes/DispFactory";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";

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

    private readonly _shapePanelContextSubject = new Subject<PeekCanvasShapePropsContext | null>();

    shapePanelContext: PeekCanvasShapePropsContext | null = null;

    // ---------------
    // LiveDB Props

    private readonly _liveDbPanelContextSubject = new Subject<undefined | null>();

    liveDbPanelContext: undefined | null = null;

    // ---------------
    // Group Ptr Props

    private readonly _groupPtrPanelContextSubject = new Subject<undefined | null>();

    groupPtrPanelContext: undefined | null = null;

    // ---------------
    // General things

    private modelSetId: number = -1;
    private coordSetId: number = -1;

    constructor(private lookupService: DiagramLookupService) {

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

    get groupPtrPanelContextObservable(): Observable<undefined | null> {
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

    private setLiveDbPanelContextObservable(): void {
        // this._liveDbPanelContextSubject;
    }

    private setGroupPtrPanelContextObservable(): void {
        this._groupPtrPanelContextSubject.next();
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

    setSelectedShapes(disps: DispBaseT[]): void {

        // SET THE POPUP
        if (disps.length != 1) {
            if (this._contextPanelState == EditorContextType.SHAPE_PROPERTIES)
                this.closeContext();

            this.setShapePanelContextObservable(null);
            return;
        }

        let disp = disps[0];

        // Setup the shape edit context
        let shapePropsContext = new PeekCanvasShapePropsContext(
            disp, this.lookupService, this.modelSetId, this.coordSetId
        );

        DispFactory.wrapper(disp).makeShapeContext(shapePropsContext);

        this.setShapePanelContextObservable(shapePropsContext);

    }


}