import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {
    DiagramBranchContext,
    DiagramBranchLocation
} from "../../branch/DiagramBranchContext";
import {PrivateDiagramBranchContext} from "../branch/PrivateDiagramBranchContext";
import {BranchTuple} from "../branch/BranchTuple";
import {BranchIndexLoaderServiceA} from "../branch-loader/BranchIndexLoaderServiceA";
import {DiagramBranchService} from "../../DiagramBranchService";
import {DiagramLookupService} from "../../DiagramLookupService";
import {DiagramCoordSetService} from "../../DiagramCoordSetService";


export interface PopupEditBranchSelectionArgs {
    modelSetKey: string;
    coordSetKey: string;
}

/** Diagram Branch Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramBranchService extends DiagramBranchService {

    private _startEditingObservable = new Subject<PrivateDiagramBranchContext>();
    private _stopEditingObservable = new Subject<void>();

    private _popupEditBranchSelectionSubject: Subject<PopupEditBranchSelectionArgs>
        = new Subject<PopupEditBranchSelectionArgs>();

    constructor(private lookupService: DiagramLookupService,
                private coordSetService: DiagramCoordSetService,
                private branchLoader: BranchIndexLoaderServiceA) {
        super();

    }

    getOrCreateBranch(modelSetKey: string, coordSetKey: string,
                      branchKey: string,
                      location: DiagramBranchLocation): Promise<DiagramBranchContext> {

        let prom: any = new Promise<DiagramBranchContext>((resolve, reject) => {
            if (location != DiagramBranchLocation.LocalBranch) {
                reject("Only local branches are implemented");
                return;
            }

            let branch = new BranchTuple();
            let val: DiagramBranchContext = new PrivateDiagramBranchContext(
                this.lookupService,
                branch, modelSetKey, coordSetKey
            );
            resolve(val);
        });
        return prom;
    }

    // ---------------
    // Layer Select Popup
    /** This method is called from the diagram-toolbar component */
    popupEditBranchSelection(modelSetKey: string, coordSetKey: string): void {
        this._popupEditBranchSelectionSubject.next({
            modelSetKey: modelSetKey,
            coordSetKey: coordSetKey
        })
    }

    /** This observable is subscribed to by the select layer popup */
    get popupEditBranchSelectionObservable(): Observable<PopupEditBranchSelectionArgs> {
        return this._popupEditBranchSelectionSubject;
    }


    startEditing(modelSetKey: string, coordSetKey: string,
                 branchKey: string, location: DiagramBranchLocation): void {
        this.getOrCreateBranch(modelSetKey, coordSetKey, branchKey, location)
            .catch(e => this._startEditingObservable.error(e))
            .then((context: any) => this._startEditingObservable.next(context));
    }

    get startEditingObservable(): Observable<PrivateDiagramBranchContext> {
        return this._startEditingObservable;
    }

    stopEditing(): void {
        this._stopEditingObservable.next();
    }

    get stopEditingObservable(): Observable<void> {
        return this._stopEditingObservable;
    }


}