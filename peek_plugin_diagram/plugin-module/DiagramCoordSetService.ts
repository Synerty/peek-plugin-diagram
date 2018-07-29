import {Injectable} from "@angular/core";
import {Payload, TupleOfflineStorageService, TupleSelector} from "@synerty/vortexjs";
import {DiagramCoordSetTuple} from "./tuples/DiagramCoordSetTuple";
import {Observable} from "rxjs";
import {PrivateDiagramTupleService} from "./_private/services";
import {ModelCoordSet} from "./_private/tuples";


/** Diagram Coord Set Service
 *
 * This service allows other plugins to load coord set tuples from the diagrams offliine
 * cache.
 */
@Injectable()
export class DiagramCoordSetService {
    constructor(private tupleService: PrivateDiagramTupleService) {


    }

    /** Coord Sets
     *
     * Return the coord sets that belong to the modelSetKey
     *
     * @param modelSetKey
     */
    coordSets(modelSetKey: string): Observable<DiagramCoordSetTuple[]> {
        let ts = new TupleSelector(ModelCoordSet.tupleName, {});
        return this.tupleService.offlineObserver
            .subscribeToTupleSelector(ts)
            .map((tuples: ModelCoordSet[]) => {
                let filtered = [];
                for (let tuple of tuples) {
                    if (tuple.data.modelSetKey != modelSetKey)
                        continue;

                    let item = new DiagramCoordSetTuple();
                    item.name = tuple.name;
                    item.key = tuple.key;
                    filtered.push(item)
                }
                return filtered;
            })
    }


}