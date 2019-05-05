import {Injectable} from "@angular/core";

import {
    ComponentLifecycleEventEmitter,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService,
    TupleSelector,
    TupleStorageFactoryService
} from "@synerty/vortexjs";

import {branchCacheStorageName, diagramTuplePrefix} from "../PluginNames";
import {BranchTuple} from "../branch/BranchTuple";
import {DiagramBranchContext} from "../../branch/DiagramBranchContext";


// ----------------------------------------------------------------------------
/** LocallyStoredBranchTupleSelector
 *
 * This is just a short cut for the tuple selector
 */

class LocallyStoredBranchTupleSelector extends TupleSelector {

    constructor(private modelSetKey: string,
                private key: string) {
        super(diagramTuplePrefix + "BranchTuple.LocallyStored", {
            modelSetKey: modelSetKey,
            key: key
        });
    }

}

/** The interface of the stored data
 *
 */
type StoredBranchT = {
    [coordSetId: number]: {}
};

// ----------------------------------------------------------------------------
/** Local Branch Storage Service
 *
 * This class manages storing of branches locally, this allows branches to
 * be created and edited offline.
 *
 * 1) Maintain a local storage of the BranchTuple
 *
 */
@Injectable()
export class LocalBranchStorageService extends ComponentLifecycleEventEmitter {
    private storage: TupleOfflineStorageService;

    constructor(storageFactory: TupleStorageFactoryService) {
        super();

        this.storage = new TupleOfflineStorageService(
            storageFactory,
            new TupleOfflineStorageNameService(branchCacheStorageName)
        );


    }


    /** Get Branch
     *
     * Get the objects with matching key from the index..
     *
     */
    loadBranch(modelSetKey: string, coordSetId: number, key: string): Promise<BranchTuple | null> {
        let prom: any = this.loadBranches(modelSetKey, key)
            .then((branches: BranchTuple[]) => {
                for (let branch of branches) {
                    if (branch.coordSetId == coordSetId)
                        return branch;
                }
            });
        return prom;
    }


    /** Get Branches
     *
     * Get the branches with the matching
     *
     */
    loadBranches(modelSetKey: string, key: string): Promise<BranchTuple[]> {
        let ts = new LocallyStoredBranchTupleSelector(modelSetKey, key);
        let prom: any = this.storage.loadTuples(ts)
            .then((loadedData) => {
                let items: StoredBranchT = loadedData;
                let branches = [];
                for (key of Object.keys(items))
                    branches.push(items[key]);
                return branches;
            });
        return prom;
    }


    saveBranch(branchContext: DiagramBranchContext): Promise<void> {
        let branchTuple: BranchTuple = branchContext["branch"];
        let ts = new LocallyStoredBranchTupleSelector(
            branchContext.modelSetKey,
            branchContext.key);
        let prom: any = this.storage.loadTuples(ts)
            .then((loadedData) => {
                let items: StoredBranchT = loadedData;
                if (items == null)
                    items = {};
                items[branchTuple.coordSetId] = branchTuple;
                return this.storage.saveTuples(ts, <any>items);
            });
        return prom;
    }


}