import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramBranchContext} from "../../branch/DiagramBranchContext";
import {BranchLocation} from "@peek/peek_plugin_branch/";
import {PrivateDiagramBranchContext} from "../branch/PrivateDiagramBranchContext";
import {BranchTuple} from "../branch/BranchTuple";
import {BranchIndexLoaderServiceA} from "../branch-loader/BranchIndexLoaderServiceA";
import {DiagramBranchService} from "../../DiagramBranchService";
import {DiagramLookupService} from "../../DiagramLookupService";
import {DiagramCoordSetService} from "../../DiagramCoordSetService";
import {BranchIndexResultI, LocalBranchStorageService} from "../branch-loader";
import {ModelCoordSet} from "../tuples";
import {PrivateDiagramCoordSetService, PrivateDiagramTupleService} from "../services";

import * as moment from "moment";
import {BranchUpdateTupleAction} from "./BranchUpdateTupleAction";

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


    private coordSetService: PrivateDiagramCoordSetService;

    constructor(private lookupService: DiagramLookupService,
                coordSetService: DiagramCoordSetService,
                private branchLocalLoader: LocalBranchStorageService,
                private branchIndexLoader: BranchIndexLoaderServiceA,
                private tupleService: PrivateDiagramTupleService) {
        super();

        this.coordSetService = <PrivateDiagramCoordSetService>coordSetService;

    }

    getOrCreateBranch(modelSetKey: string, coordSetKey: string,
                      branchKey: string,
                      location: BranchLocation): Promise<DiagramBranchContext> {
        if (!this.coordSetService.isReady())
            throw new Error("CoordSet service is not initialised yet");

        let coordSet: ModelCoordSet = this.coordSetService
            .coordSetForKey(modelSetKey, coordSetKey);

        let indexBranch: BranchTuple | null = null;
        let localBranch: BranchTuple | null = null;

        let promises = [];

        // Load the branch from the index
        if (location == BranchLocation.ServerBranch) {
            promises.push(
                this.branchIndexLoader.getBranches(modelSetKey, coordSet.id, [branchKey])
                    .then((results: BranchIndexResultI) => {
                        // This will be null if it didn't find one.
                        if (results[branchKey] != null)
                            indexBranch = results[branchKey][0];
                    })
            );
        }

        // Load
        promises.push(
            this.branchLocalLoader.loadBranch(modelSetKey, coordSet.id, branchKey)
                .then((branch: BranchTuple | null) => {
                    localBranch = branch;
                })
        );

        let prom: any = Promise.all(promises)
            .then(() => {
                let branch = null;
                if (localBranch != null && indexBranch != null) {
                    if (moment(localBranch.updatedDate).isAfter(indexBranch.updatedDate))
                        branch = localBranch;
                    else
                        branch = indexBranch;

                } else if (localBranch != null) {
                    branch = localBranch;
                } else if (indexBranch != null) {
                    branch = indexBranch;
                } else {
                    branch = BranchTuple.createBranch(coordSet.id, branchKey);
                }

                let val: DiagramBranchContext = new PrivateDiagramBranchContext(
                    this.lookupService,
                    branch, modelSetKey, coordSetKey,
                    (context) => this.saveBranch(coordSet.modelSetId, context)
                );
                return val;

            });

        return prom;
    }

    private saveBranch(modelSetId:number, branchContext: PrivateDiagramBranchContext): Promise<void> {
        let promises = [];

        promises.push(this.branchLocalLoader.saveBranch(branchContext));

        if (branchContext.location == BranchLocation.ServerBranch) {
            let action = new BranchUpdateTupleAction();
            action.modelSetId = modelSetId;
            action.branchTuple = branchContext.branchTuple;
            this.tupleService.offlineAction.pushAction(action);
        }

        let prom: any = Promise.all(promises);
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
                 branchKey: string, location: BranchLocation): void {
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