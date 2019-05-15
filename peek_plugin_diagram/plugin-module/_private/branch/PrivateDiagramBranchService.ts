import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PrivateDiagramBranchContext} from "../branch/PrivateDiagramBranchContext";
import {BranchTuple} from "../branch/BranchTuple";
import {BranchIndexLoaderServiceA} from "../branch-loader/BranchIndexLoaderServiceA";
import {DiagramLookupService} from "../../DiagramLookupService";
import {DiagramCoordSetService} from "../../DiagramCoordSetService";
import {BranchIndexResultI, LocalBranchStorageService} from "../branch-loader";
import {ModelCoordSet} from "../tuples";
import {PrivateDiagramCoordSetService, PrivateDiagramTupleService} from "../services";

import * as moment from "moment";
import {
    ComponentLifecycleEventEmitter,
    TupleSelector,
    VortexStatusService
} from "@synerty/vortexjs";
import {BranchKeyToIdMapTuple} from "./BranchKeyToIdMapTuple";
import {BranchDetailTuple} from "@peek/peek_plugin_branch";
import {UserService} from "@peek/peek_plugin_user";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";

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
export class PrivateDiagramBranchService extends ComponentLifecycleEventEmitter {

    private _startEditingObservable = new Subject<PrivateDiagramBranchContext>();
    private _stopEditingObservable = new Subject<void>();

    private _popupEditBranchSelectionSubject: Subject<PopupEditBranchSelectionArgs>
        = new Subject<PopupEditBranchSelectionArgs>();


    private coordSetService: PrivateDiagramCoordSetService;

    private branchIdMapByCoordSetId: { [coordSetId: number]: BranchKeyToIdMapTuple } = {};

    private enabledBranches: BranchDetailTuple[] = [];

    constructor(private vortexStatusService: VortexStatusService,
                private balloonMsg: Ng2BalloonMsgService,
                private userService: UserService,
                private lookupService: DiagramLookupService,
                coordSetService: DiagramCoordSetService,
                private branchLocalLoader: LocalBranchStorageService,
                private branchIndexLoader: BranchIndexLoaderServiceA,
                private tupleService: PrivateDiagramTupleService) {
        super();

        this.coordSetService = <PrivateDiagramCoordSetService>coordSetService;

        let tupleSelector = new TupleSelector(BranchKeyToIdMapTuple.tupleName, {});

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(tupleSelector)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: BranchKeyToIdMapTuple[]) => {
                this.branchIdMapByCoordSetId = {};
                for (let tuple of tuples) {
                    this.branchIdMapByCoordSetId[tuple.coordSetId] = tuple;
                }
            });

    }

    setVisibleBranches(commonBranches: BranchDetailTuple[]): void {
        this.enabledBranches = commonBranches;

    }

    getVisibleBranchIds(coordSetId: number): number[] {
        let keyIdMapTuple = this.branchIdMapByCoordSetId[coordSetId];
        if (keyIdMapTuple == null)
            return [];

        let ids = [];
        for (let branch of this.enabledBranches) {
            let branchId = keyIdMapTuple.keyIdMap[branch.key];
            if (branchId != null)
                ids.push(branchId);
        }
        return ids;
    }

    getDiagramBranchKeys(coordSetId: number): string[] {
        let keyIdMapTuple = this.branchIdMapByCoordSetId[coordSetId];
        if (keyIdMapTuple == null)
            return [];

        return Object.keys(keyIdMapTuple.keyIdMap);
    }


    getBranch(modelSetKey: string, coordSetKey: string,
              branchKey: string): Promise<PrivateDiagramBranchContext | null> {
        return this._loadBranch(modelSetKey, coordSetKey, branchKey, false);
    }

    getOrCreateBranch(modelSetKey: string, coordSetKey: string,
                      branchKey: string): Promise<PrivateDiagramBranchContext> {
        return this._loadBranch(modelSetKey, coordSetKey, branchKey, true);

    }

    private _loadBranch(modelSetKey: string, coordSetKey: string,
                        branchKey: string,
                        createIfMissing: boolean): Promise<PrivateDiagramBranchContext | null> {
        if (!this.coordSetService.isReady())
            throw new Error("CoordSet service is not initialised yet");

        let coordSet: ModelCoordSet = this.coordSetService
            .coordSetForKey(modelSetKey, coordSetKey);

        let indexBranch: BranchTuple | null = null;
        let localBranch: BranchTuple | null = null;

        let promises = [];

        // Load the branch from the index
        promises.push(
            this.branchIndexLoader
                .getBranches(modelSetKey, coordSet.id, [branchKey])
                .then((results: BranchIndexResultI) => {
                    // This will be null if it didn't find one.
                    if (results[branchKey] != null)
                        indexBranch = results[branchKey][0];
                })
        );

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
                    if (!createIfMissing)
                        return null;

                    branch = BranchTuple.createBranch(coordSet.id, branchKey);
                }

                branch.linkDisps(this.lookupService);

                return new PrivateDiagramBranchContext(
                    this.vortexStatusService,
                    this.balloonMsg,
                    this.lookupService, branch,
                    coordSet.modelSetId, modelSetKey, coordSetKey,
                    this.tupleService,
                    this.branchLocalLoader,
                    this.userService.userDetails
                );

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
                 branchKey: string): void {
        this.getOrCreateBranch(modelSetKey, coordSetKey, branchKey)
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