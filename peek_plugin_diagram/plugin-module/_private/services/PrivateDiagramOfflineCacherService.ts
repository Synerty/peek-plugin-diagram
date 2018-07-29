import {Injectable} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    TupleSelector
} from "@synerty/vortexjs";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {ModelCoordSet, ModelSet} from "../tuples";
import {
    DispColor,
    DispLayer,
    DispLevel,
    DispLineStyle,
    DispTextStyle
} from "peek_plugin_diagram/tuples/lookups";


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

    constructor(private tupleService: PrivateDiagramTupleService) {
        super();

        let date7DaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

        // Delete data older than 7 days
        this.tupleService.offlineStorage
            .deleteOldTuples(date7DaysAgo)
            .catch(err => console.log(`ERROR: Failed to delete old tuples`))
            .then(() => {

                this.loadModelSet();
                this.loadModelCoordSet();
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