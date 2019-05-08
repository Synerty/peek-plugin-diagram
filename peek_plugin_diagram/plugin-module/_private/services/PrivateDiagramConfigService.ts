import {Injectable} from "@angular/core";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {Observable, Subject} from "rxjs";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

export interface PopupLayerSelectionArgsI {
    modelSetKey: string;
    coordSetKey: string;
}

export interface PopupBranchSelectionArgsI {
    modelSetKey: string;
    coordSetKey: string;
}

/** CoordSetCache
 *
 * This class is responsible for buffering the coord sets in memory.
 *
 * Typically there will be less than 20 of these.
 *
 */
@Injectable()
export class PrivateDiagramConfigService extends ComponentLifecycleEventEmitter {

    private _popupLayerSelectionSubject: Subject<PopupLayerSelectionArgsI>
        = new Subject<PopupLayerSelectionArgsI>();

    private _popupBranchSelectionSubject: Subject<PopupBranchSelectionArgsI>
        = new Subject<PopupBranchSelectionArgsI>();


    constructor(private tupleService: PrivateDiagramTupleService) {
        super();
    }

    // ---------------
    // Layer Select Popup
    /** This method is called from the diagram-toolbar component */
    popupLayerSelection(modelSetKey: string, coordSetKey: string): void {
        this._popupLayerSelectionSubject.next({
            modelSetKey: modelSetKey,
            coordSetKey: coordSetKey
        })
    }

    /** This observable is subscribed to by the select layer popup */
    popupLayerSelectionObservable(): Observable<PopupLayerSelectionArgsI> {
        return this._popupLayerSelectionSubject;
    }

    // ---------------
    // Branch Select Popup
    /** This method is called from the diagram-toolbar component */
    popupBranchesSelection(modelSetKey: string, coordSetKey: string): void {
        this._popupBranchSelectionSubject.next({
            modelSetKey: modelSetKey,
            coordSetKey: coordSetKey
        })
    }

    /** This observable is subscribed to by the select branch popup */
    popupBranchesSelectionObservable(): Observable<PopupBranchSelectionArgsI> {
        return this._popupBranchSelectionSubject;
    }


}
