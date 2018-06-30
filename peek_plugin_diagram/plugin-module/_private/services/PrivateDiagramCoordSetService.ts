import {Injectable} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    TupleDataOfflineObserverService,
    TupleSelector
} from "@synerty/vortexjs";
import {ModelCoordSet} from "../tuples/ModelCoordSet";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";

/** CoordSetCache
 *
 * This class is responsible for buffering the coord sets in memory.
 *
 * Typically there will be less than 20 of these.
 *
 */
@Injectable()
export class PrivateDiagramCoordSetService extends ComponentLifecycleEventEmitter {

    private modelSetKey: string = "";

    private _coordSetByKey = {};
    private _coordSetById = {};

    private subscriptions = [];
    private _isReady: boolean = false;


    constructor(private tupleService: PrivateDiagramTupleService) {
        super();
        this.initialLoad();
    }

    private initialLoad(): void {

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(new TupleSelector(ModelCoordSet.tupleName, {}))
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: any[]) => {
                this._coordSetByKey = {};

                for (let item of tuples) {
                    this._coordSetByKey[item.key] = item;
                    this._coordSetById[item.id] = item;
                }

                this._isReady = tuples.length != 0;
            })
    }

    shutdown(): void {
    };

    isReady(): boolean {
        return this._isReady;
    };

    coordSetForKey(coordSetKey: string): ModelCoordSet {
        return this._coordSetByKey[coordSetKey];
    };

    coordSetForId(id: number): ModelCoordSet {
        return this._coordSetById[id];
    };


}
