import {Injectable} from "@angular/core";
import {TupleSelector} from "@synerty/vortexjs";
import {dictKeysFromObject} from "../DiagramUtil";
import {DiagramClientTupleOfflineObservable} from "../DiagramClientTupleOfflineObservable.web";
import {ModelCoordSet} from "../tuples/model/ModelCoordSet";

/** CoordSetCache
 *
 * This class is responsible for buffering the coord sets in memory.
 *
 * Typically there will be less than 20 of these.
 *
 */
@Injectable()
export class CoordSetCache {

    private _coordSetByKey = {};

    private subscriptions = [];
    private _isReady: boolean = false;


    constructor(private clientTupleObservable: DiagramClientTupleOfflineObservable) {

        this.subscriptions.push(
            this.clientTupleObservable.subscribeToTupleSelector(
                new TupleSelector(ModelCoordSet.tupleName, {})
            ).subscribe((tuples: any[]) => {
                this._coordSetByKey = {};

                for (let item of tuples) {
                    this._coordSetByKey[item.key] = item;
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

        if (dictKeysFromObject(this._coordSetByKey).length == 0)
            return false;

        this._isReady = true;
        return true;
    };

    coordSetForKey(coordSetKey: string): ModelCoordSet {
        return this._coordSetByKey[coordSetKey];
    };


}
