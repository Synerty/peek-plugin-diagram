import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PeekCanvasShapePropsContext} from "./PeekCanvasShapePropsContext";
import {DispBaseT} from "../tuples/shapes/DispBase";
import {DispFactory} from "../tuples/shapes/DispFactory";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";

export enum EditorContextType {
    NONE,
    BRANCH_PROPERTIES,
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
    // Branch variables

    private readonly _branchPanelContextSubject = new Subject<string | null>();

    branchPanelContext: string | null = null;

    // ---------------
    // Shape Props

    private readonly _shapePanelContextSubject = new Subject<PeekCanvasShapePropsContext | null>();

    shapePanelContext: PeekCanvasShapePropsContext | null = null;

    // ---------------
    // LiveDB Props

    private readonly _liveDbPanelContextSubject = new Subject<undefined | null>();

    liveDbPanelContext: undefined | null = null;

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

    get branchPanelContextObservable(): Observable<string | null> {
        return this._branchPanelContextSubject;
    }

    get shapePanelContextObservable(): Observable<PeekCanvasShapePropsContext | null> {
        return this._shapePanelContextSubject;
    }

    get liveDbPanelContextObservable(): Observable<undefined | null> {
        return this._liveDbPanelContextSubject;
    }

    // ---------------
    // Methods called by toolbar

    private changeContextPanel(newState: EditorContextType): void {
        this._contextPanelState = newState;
        this._contextPanelChangeSubject.next(newState);
    }

    showBranchProperties() {
        this.changeContextPanel(EditorContextType.BRANCH_PROPERTIES);
    }

    showShapeProperties() {
        this.changeContextPanel(EditorContextType.SHAPE_PROPERTIES);
    }

    showDynamicProperties() {
        this.changeContextPanel(EditorContextType.DYNAMIC_PROPERTIES);
    }

    // ---------------
    // Methods called by Context

    closeContext() {
        this.changeContextPanel(EditorContextType.NONE);
    }

    // ---------------
    // The shape selection has been updated

    setSelectedShapes(disps: DispBaseT[]): void {

        // SET THE POPUP
        if (disps.length != 1) {
            if (this._contextPanelState == EditorContextType.SHAPE_PROPERTIES)
                this.closeContext();

            this.shapePanelContext = null;
            this._shapePanelContextSubject.next(null);
            return;
        }

        let disp = disps[0];

        // Setup the shape edit context
        let shapePropsContext = new PeekCanvasShapePropsContext(
            disp, this.lookupService, this.modelSetId, this.coordSetId
        );

        DispFactory.wrapper(disp).makeShapeContext(shapePropsContext);

        this.shapePanelContext = shapePropsContext;
        this._shapePanelContextSubject.next(shapePropsContext);

    }


}