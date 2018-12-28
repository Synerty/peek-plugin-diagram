import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {VortexStatusService} from "@synerty/vortexjs";
import {DiagramBranchService} from "../../DiagramBranchService";
import {DiagramBranchContext, DiagramBranchLocation} from "../../branch/DiagramBranchContext";
import {PrivateDiagramBranchContext} from "../branch/PrivateDiagramBranchContext";
import {DiagramBranchTuple} from "../branch/DiagramBranchTuple";
import {PrivateDiagramBranchLoaderServiceA} from "../branch-loader";

/** Diagram Branch Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramBranchService extends DiagramBranchService {

    private _startEditingObservable = new Subject<PrivateDiagramBranchContext>();
    private _stopEditingObservable = new Subject<void>();

    constructor(private branchLoader: PrivateDiagramBranchLoaderServiceA) {
        super();

    }

    getOrCreateBranch(modelSetKey: string, coordSetKey: string,
                      branchKey: string,
                      location: DiagramBranchLocation): Promise<DiagramBranchContext> {
        return new Promise<DiagramBranchContext>((resolve, reject) => {
            if (location != DiagramBranchLocation.LocalBranch) {
                reject("Only local branches are implemented");
                return;
            }

            let branch = new DiagramBranchTuple();
            let val: DiagramBranchContext = new PrivateDiagramBranchContext(branch);
            resolve(val);
        });
    }


    startEditing(modelSetKey: string, coordSetKey: string,
                 branchKey: string, location: DiagramBranchLocation): void {
        let context = this.getOrCreateBranch(
            modelSetKey, coordSetKey, branchKey, location
        );
        this._startEditingObservable.next(context);
    }

    stopEditing(): void {
        this._stopEditingObservable.next();
    }

    get startEditingObservable(): Observable<PrivateDiagramBranchContext> {
        return this._startEditingObservable;
    }

    get stopEditingObservable(): Observable<void> {
        return this._stopEditingObservable;
    }


}