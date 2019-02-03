import {Injectable} from "@angular/core";
import {TupleDataOfflineObserverService, TupleSelector} from "@synerty/vortexjs";

import {PrivateDiagramTupleService} from "./_private/services/PrivateDiagramTupleService";
import {DiagramLookupCache} from "./DiagramLookupCache";
import {filter} from "rxjs/operators";

/** Lookup Factory Service
 *
 * This class is responsible for providing diagram lookups caches for who ever request
 * it.
 *
 */
@Injectable()
export class DiagramLookupFactoryService {

    private _cachesByModelSetKey: { [key: string]: DiagramLookupCache } = {};


    constructor(private tupleService: PrivateDiagramTupleService) {

    }

    /** Load Cache
     *
     * Loads a DiagramLookupCache class for the requested model set.
     * @param modelSetKey
     */
    loadCache(modelSetKey: string): Promise<DiagramLookupCache> {
        let prom: any = null;

        if (this._cachesByModelSetKey[modelSetKey] != null) {
            prom = Promise.resolve(this._cachesByModelSetKey[modelSetKey]);

        } else {
            prom = new Promise<DiagramLookupCache>((resolve, reject) => {
                let newCache = new DiagramLookupCache(this.tupleService, modelSetKey);
                newCache
                    .isReadyObservable()
                    .pipe(filter(val => val))
                    .first()
                    .subscribe(() => resolve(newCache));
            });
        }

        return prom;
    }


}
