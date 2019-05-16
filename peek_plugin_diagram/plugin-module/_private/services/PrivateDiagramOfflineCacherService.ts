import {Injectable} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    TupleSelector,
    VortexStatusService
} from "@synerty/vortexjs";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {ModelCoordSet, ModelSet} from "../tuples";
import {
    DispColor,
    DispLayer,
    DispLevel,
    DispLineStyle,
    DispTextStyle
} from "../../lookups";
import {BranchKeyToIdMapTuple} from "../branch/BranchKeyToIdMapTuple";
import {BranchDetailTuple, BranchService} from "@peek/peek_plugin_branch";


/** Diagram Lookups offline cacher
 *
 * This Service is never unloaded, it makes sure that the lookups that the diagram
 * needs are always stored in the local DB.
 *
 * For NS, This is where the embedded web version reads it from.
 *
 */
@Injectable()
export class PrivateDiagramOfflineCacherService extends ComponentLifecycleEventEmitter {

    private static readonly LookupTuples = [
        DispLevel,
        DispLayer,
        DispColor,
        DispTextStyle,
        DispLineStyle
    ];

    private lookupSubs = [];

    constructor(private tupleService: PrivateDiagramTupleService,
                vortexStatusService: VortexStatusService,
                private globalBranchService: BranchService) {
        super();

        // Delete data older than 7 days
        let date7DaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

        let promise = null;
        if (vortexStatusService.snapshot.isOnline) {
            promise = this.tupleService.offlineStorage
                .deleteOldTuples(date7DaysAgo)
                .catch(err => console.log(`ERROR: Failed to delete old tuples`));

        } else {
            vortexStatusService.isOnline
                .takeUntil(this.onDestroyEvent)
                .filter((val) => val === true)
                .first()
                .subscribe(() => {
                    this.tupleService.offlineStorage
                        .deleteOldTuples(date7DaysAgo)
                        .catch(err => console.log(`ERROR: Failed to delete old tuples`));
                });
            promise = Promise.resolve();
        }

        promise
            .then(() => {
                this.loadModelSet();
                this.loadModelCoordSet();
                this.loadBranchToIdMap();
            });

    }

    /**
     * Cache Model Set
     *
     * This method caches the model set list for offline use.
     *
     */
    private loadModelSet() {

        let tupleSelector = new TupleSelector(ModelSet.tupleName, {});

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(tupleSelector)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: ModelSet[]) => {
                this.tupleService.offlineObserver.flushCache(tupleSelector);

                for (let modelSet of tuples) {
                    this.loadLookup(modelSet);

                    // force the global branch service to cache it's stuff
                    this.globalBranchService.branches(modelSet.key);
                }

            });
    }

    /**
     * Cache Model Set
     *
     * This method caches the coord sets
     *
     */
    private loadModelCoordSet() {

        let tupleSelector = new TupleSelector(ModelCoordSet.tupleName, {});

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(tupleSelector)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: ModelCoordSet[]) => {
                this.tupleService.offlineObserver.flushCache(tupleSelector);
            });

    }

    /**
     * Cache Branch KeyToIdMap Tuple
     *
     * This method caches the coord sets
     *
     */
    private loadBranchToIdMap() {

        let tupleSelector = new TupleSelector(BranchKeyToIdMapTuple.tupleName, {});

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(tupleSelector)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: BranchKeyToIdMapTuple[]) => {
                this.tupleService.offlineObserver.flushCache(tupleSelector);
            });

    }

    /**
     * Cache Lookups
     *
     * This method caches the lookups for a model set
     *
     */
    private loadLookup(modelSet: ModelSet) {
        while (this.lookupSubs.length)
            this.lookupSubs.pop().unsubscribe();

        for (let LookupTuple of PrivateDiagramOfflineCacherService.LookupTuples) {
            let tupleSelector = new TupleSelector(LookupTuple.tupleName, {
                "modelSetKey": modelSet.key
            });

            let sub = this.tupleService.offlineObserver
                .subscribeToTupleSelector(tupleSelector)
                .takeUntil(this.onDestroyEvent)
                .subscribe((tuples: any[]) => {
                    this.tupleService.offlineObserver.flushCache(tupleSelector);
                });

            this.lookupSubs.push(sub);
        }

    }

}