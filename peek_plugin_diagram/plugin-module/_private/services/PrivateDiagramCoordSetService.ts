import {Injectable} from "@angular/core";
import {ComponentLifecycleEventEmitter, TupleSelector} from "@synerty/vortexjs";
import {ModelCoordSet} from "../tuples/ModelCoordSet";
import {PrivateDiagramTupleService} from "./PrivateDiagramTupleService";
import {DiagramCoordSetService} from "../../DiagramCoordSetService";
import {DiagramCoordSetTuple} from "../../tuples/DiagramCoordSetTuple";
import {Observable, Subject} from "rxjs";

/** CoordSetCache
 *
 * This class is responsible for buffering the coord sets in memory.
 *
 * Typically there will be less than 20 of these.
 *
 */
@Injectable()
export class PrivateDiagramCoordSetService extends ComponentLifecycleEventEmitter
    implements DiagramCoordSetService {

    private modelSetKey: string = "";

    private _coordSetByKey = {};
    private _coordSetById = {};

    private subscriptions = [];
    private _isReady: boolean = false;

    private _coordSetSubjectByModelSetKey
        : { [key: string]: Subject<DiagramCoordSetTuple[]> } = {};

    private _lastDiagramCoordSetTuplesByModelSetKey
        : { [key: string]: DiagramCoordSetTuple[] } = {};


    constructor(private tupleService: PrivateDiagramTupleService) {
        super();
        this.initialLoad();
    }

    shutdown(): void {
    };

    isReady(): boolean {
        return this._isReady;
    };

    private initialLoad(): void {
        let ts = new TupleSelector(ModelCoordSet.tupleName, {});

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(ts)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: ModelCoordSet[]) => {
                this._coordSetByKey = {};

                for (let item of tuples) {
                    this._coordSetByKey[item.key] = item;
                    this._coordSetById[item.id] = item;
                }

                this._isReady = tuples.length != 0;
                this.notifyForDiagramCoordSetTuples(tuples);
            })
    }

    private notifyForDiagramCoordSetTuples(tuples: ModelCoordSet[]): void {

        let coordSetsByModelSetKey = {};
        for (let tuple of tuples) {
            if (coordSetsByModelSetKey[tuple.data.modelSetKey] == null)
                coordSetsByModelSetKey[tuple.data.modelSetKey] = [];

            let item = new DiagramCoordSetTuple();
            item.name = tuple.name;
            item.key = tuple.key;
            coordSetsByModelSetKey[tuple.data.modelSetKey].push(item);
        }

        this._lastDiagramCoordSetTuplesByModelSetKey = coordSetsByModelSetKey;

        for (let key of Object.keys(coordSetsByModelSetKey)) {
            if (this._coordSetSubjectByModelSetKey[key] != null)
                this._coordSetSubjectByModelSetKey[key].next(coordSetsByModelSetKey[key]);
        }
    }


    /** Coord Sets
     *
     * Return the coord sets that belong to the modelSetKey
     *
     * @param modelSetKey
     */
    diagramCoordSetTuples(modelSetKey: string): Observable<DiagramCoordSetTuple[]> {
        // Create the subject if we need to
        if (this._coordSetSubjectByModelSetKey[modelSetKey] == null) {
            this._coordSetSubjectByModelSetKey[modelSetKey]
                = new Subject<DiagramCoordSetTuple[]>();
        }
        let subject = this._coordSetSubjectByModelSetKey[modelSetKey];

        // Notify the observer once they have registered if we already have data
        let lastData = this._lastDiagramCoordSetTuplesByModelSetKey[modelSetKey];
        if (lastData != null)
            setTimeout(() => subject.next(lastData), 10);

        // return the subject.
        return subject;
    }

    coordSetForKey(coordSetKey: string): ModelCoordSet {
        return this._coordSetByKey[coordSetKey];
    };

    coordSetForId(id: number): ModelCoordSet {
        return this._coordSetById[id];
    };


}
