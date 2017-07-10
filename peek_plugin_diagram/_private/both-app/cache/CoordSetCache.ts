import {Injectable} from "@angular/core";
import {TupleSelector} from "@synerty/vortexjs";
import {dictKeysFromObject} from "../DiagramUtil";
import {DiagramClientTupleOfflineObservable} from "../DiagramClientTupleOfflineObservable";
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

    private _coordSetById = {};

    private subscriptions = [];


    constructor(private clientTupleObservable: DiagramClientTupleOfflineObservable) {


    }

// ============================================================================
// Init

    isReady() {
        return dictKeysFromObject(this._coordSetById).length != 0;
    };

// ============================================================================
// Init

    shutdown() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    };

// ============================================================================
// Accessors for common lookup data

    private _init() {

        this.subscriptions.push(
            this.clientTupleObservable.subscribeToTupleSelector(
                new TupleSelector(ModelCoordSet.tupleName, {})
            ).subscribe((tuples: any[]) => {
                this._coordSetById = {};

                for (let item of tuples) {
                    this._coordSetById[item.id] = item;
                }

            })
        );

    };


    coordSetForId(coordSetId) {

        return this._coordSetById[coordSetId];
    };


}
