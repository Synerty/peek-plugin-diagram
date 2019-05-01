import {Injectable} from "@angular/core";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {DiagramConfigService} from "../../DiagramConfigService";
import {Observable, Subject} from "rxjs";

export interface PopupLayerSelectionArgs {
    modelSetKey: string;
    coordSetKey: string;
}

export interface PopupBranchSelectionArgs {
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
export class PrivateDiagramConfigService extends DiagramConfigService {

    private _popupLayerSelectionSubject: Subject<PopupLayerSelectionArgs>
        = new Subject<PopupLayerSelectionArgs>();

    private _popupBranchSelectionSubject: Subject<PopupBranchSelectionArgs>
        = new Subject<PopupBranchSelectionArgs>();


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
    popupLayerSelectionObservable(): Observable<PopupLayerSelectionArgs> {
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
    popupBranchesSelectionObservable(): Observable<PopupBranchSelectionArgs> {
        return this._popupBranchSelectionSubject;
    }


}
