import {Injectable} from "@angular/core";
import {TupleSelector} from "@synerty/vortexjs";
import {TupleDataOfflineObserverService} from "@synerty/vortexjs";
import {ModelCoordSet} from "../tuples/ModelCoordSet";
import {
    PrivateDiagramTupleService
} from "./PrivateDiagramTupleService";

/** CoordSetCache
 *
 * This class is responsible for buffering the coord sets in memory.
 *
 * Typically there will be less than 20 of these.
 *
 */
@Injectable()
export class PrivateDiagramCoordSetService {

    private modelSetKey: string = "";

    private _coordSetByKey = {};
    private _coordSetById = {};

    private subscriptions = [];
    private _isReady: boolean = false;


    constructor(private tupleService: PrivateDiagramTupleService) {
        this.initialLoad();
    }

    private initialLoad(): void {

        this.subscriptions.push(
            this.tupleService.offlineObserver.subscribeToTupleSelector(
                new TupleSelector(ModelCoordSet.tupleName, {})
            ).subscribe((tuples: any[]) => {
                this._coordSetByKey = {};

                for (let item of tuples) {
                    this._coordSetByKey[item.key] = item;
                    this._coordSetById[item.id] = item;
                }

            })
        );
    }

    shutdown(): void {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    };

    isReady(): boolean {
        // isReady is used in a doCheck loop, so make if fast once it's true
        if (this._isReady)
            return true;

        let count = 0;
        for (let key in this._coordSetByKey)
            count++;

        if (count == 0)
            return false;

        this._isReady = true;
        return true;
    };

    coordSetForKey(coordSetKey: string): ModelCoordSet {
        return this._coordSetByKey[coordSetKey];
    };

    coordSetForId(id: number): ModelCoordSet {
        return this._coordSetById[id];
    };


}
