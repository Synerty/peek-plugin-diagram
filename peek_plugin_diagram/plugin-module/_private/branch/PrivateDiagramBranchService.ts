import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {VortexStatusService} from "@synerty/vortexjs";
import {
    DiagramBranchContext,
    DiagramBranchLocation
} from "../../branch/DiagramBranchContext";
import {PrivateDiagramBranchContext} from "../branch/PrivateDiagramBranchContext";
import {BranchTuple} from "../branch/BranchTuple";
import {BranchIndexLoaderServiceA} from "../branch-loader/BranchIndexLoaderServiceA";
import {DiagramBranchService} from "../../DiagramBranchService";
import {DiagramLookupFactoryService} from "../../DiagramLookupFactoryService";
import {DiagramLookupCache} from "../../DiagramLookupCache";

/** Diagram Branch Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramBranchService extends DiagramBranchService {

    private _startEditingObservable = new Subject<PrivateDiagramBranchContext>();
    private _stopEditingObservable = new Subject<void>();

    constructor(private lookupfactory: DiagramLookupFactoryService,
                private branchLoader: BranchIndexLoaderServiceA) {
        super();

    }

    getOrCreateBranch(modelSetKey: string, coordSetKey: string,
                      branchKey: string,
                      location: DiagramBranchLocation): Promise<DiagramBranchContext> {
        let prom: any = this.lookupfactory
            .loadCache(modelSetKey)
            .then((lookupCache: DiagramLookupCache) => {
                return new Promise<DiagramBranchContext>((resolve, reject) => {
                    if (location != DiagramBranchLocation.LocalBranch) {
                        reject("Only local branches are implemented");
                        return;
                    }

                    let branch = new BranchTuple();
                    let val: DiagramBranchContext = new PrivateDiagramBranchContext(
                        lookupCache,
                        branch, modelSetKey, coordSetKey
                    );
                    resolve(val);
                });
            })
        return prom;
    }


    startEditing(modelSetKey: string, coordSetKey: string,
                 branchKey: string, location: DiagramBranchLocation): void {
        this.getOrCreateBranch(modelSetKey, coordSetKey, branchKey, location)
            .catch(e => this._startEditingObservable.error(e))
            .then((context: any) => this._startEditingObservable.next(context));
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