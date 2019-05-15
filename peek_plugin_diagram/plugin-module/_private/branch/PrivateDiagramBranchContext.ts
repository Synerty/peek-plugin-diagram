import {BranchTuple} from "./BranchTuple";
import {DiagramLookupService} from "../../DiagramLookupService";
import {BranchLiveEditTupleAction} from "./BranchLiveEditTupleAction";
import {UserListItemTuple} from "@peek/peek_plugin_user";
import {LocalBranchStorageService} from "../branch-loader";
import {BranchUpdateTupleAction} from "./BranchUpdateTupleAction";
import {PrivateDiagramTupleService} from "../services";
import {Subject} from "rxjs";
import {TupleSelector, VortexStatusService} from "@synerty/vortexjs";
import {BranchLiveEditTuple} from "./BranchLiveEditTuple";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";


/** Diagram Branch Service
 *
 * This is the implementation of the diagram branch service.
 *
 */
export class PrivateDiagramBranchContext {

    private shutdownSubject: Subject<void> = new Subject<void>();

    private updateModelCallback: (() => void) | null = null;

    private static readonly SEND_UPDATE_PERIOD = 1000;
    private updateTimerNum = null;
    private needsLiveUpdateSend = false;

    constructor(private vortexStatusService: VortexStatusService,
                private balloonMsg: Ng2BalloonMsgService,
                private lookupCache: DiagramLookupService,
                private branch: BranchTuple,
                private _modelSetId: number,
                private _modelSetKey: string,
                private _coordSetKey: string,
                private tupleService: PrivateDiagramTupleService,
                private branchLocalLoader: LocalBranchStorageService,
                private userDetails: UserListItemTuple) {

    }

    get branchTuple(): BranchTuple {
        return this.branch;
    }

    get modelSetKey(): string {
        return this._modelSetKey;
    }

    get coordSetKey(): string {
        return this._coordSetKey;
    }

    get key(): string {
        return this.branch.key;
    }

    save(): Promise<void> {
        let promises = [];

        promises.push(this.branchLocalLoader.saveBranch(this));

        let action = new BranchUpdateTupleAction();
        action.modelSetId = this._modelSetId;
        action.branchTuple = this.branch;
        promises.push(this.tupleService.offlineAction.pushAction(action));

        let prom: any = Promise.all(promises);
        return prom;
    }

    open(updateModelCallback: () => void): void {
        this.sendLiveUpdate(BranchLiveEditTupleAction.EDITING_STARTED);
        this.updateModelCallback = updateModelCallback;
        this.branch.setContextUpdateCallback(() => this.needsLiveUpdateSend = true);

        let ts = new TupleSelector(BranchLiveEditTuple.tupleName, {
            coordSetId: this.branch.coordSetId,
            key: this.branch.key
        });

        this.tupleService.observer
            .subscribeToTupleSelector(ts)
            .takeUntil(this.shutdownSubject)
            .subscribe((tuples: BranchLiveEditTuple[]) => {
                if (tuples.length == 0)
                    return;

                let update = tuples[0];
                console.log("FIX DIAGRAM LOGIN - LIVE UPDATE");
                // if (update.updatedByUser == this.userKey())
                //     return;

                if (this.branch.applyLiveUpdate(update.branchTuple)) {
                    this.branch.linkDisps(this.lookupCache);
                    // this.balloonMsg
                    //     .showInfo(`Branch has been updated by ${update.updatedByUser}`);
                    if (this.updateModelCallback != null)
                        this.updateModelCallback();
                }
            });

        this.updateTimerNum = setInterval(
            () => {
                if (this.needsLiveUpdateSend == false) return;
                this.needsLiveUpdateSend = false;
                this.sendLiveUpdate()
            },
            PrivateDiagramBranchContext.SEND_UPDATE_PERIOD)
    }

    close(): void {
        clearTimeout(this.updateTimerNum);
        this.sendLiveUpdate(BranchLiveEditTupleAction.EDITING_FINISHED);
        this.updateModelCallback = null;
        this.branch.setContextUpdateCallback(null);
        this.shutdownSubject.next();
    }

    setVisible(visible: boolean): void {
        this.branch.visible = visible;
    }

    private sendLiveUpdate(updateType: number | null = null): void {
        if (updateType == null)
            updateType = BranchLiveEditTupleAction.EDITING_UPDATED;

        let action = new BranchLiveEditTupleAction();
        action.updatedByUser = this.userKey();
        action.branchTuple = this.branch;
        action.actionType = updateType;


        let promise = null;
        if (updateType == BranchLiveEditTupleAction.EDITING_UPDATED) {
            if (this.vortexStatusService.snapshot.isOnline)
                promise = this.tupleService.action.pushAction(action);


        } else {
            promise = this.tupleService.offlineAction.pushAction(action);
        }

        if (promise != null) {
            promise.catch(
                e => console.log(`Failed to send live update for branch: ${e}`)
            );
        }

    }

    private userKey(): string {
        return "JARROD";
        // return `${this.userDetails.userTitle} (${this.userDetails.userName})`;
    }


}