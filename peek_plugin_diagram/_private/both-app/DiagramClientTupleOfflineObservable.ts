import {Injectable, NgZone} from "@angular/core";
import {
    TupleDataObservableNameService,
    TupleDataOfflineObserverService,
    TupleOfflineStorageService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {
    diagramClientObservableName,
    diagramFilt,
    diagramTupleOfflineServiceName
} from "@peek/peek_plugin_diagram/_private/PluginNames";

/** Tuple Offline Observable - Client
 *
 * In the diagram plugin, there are two observables in the client service (python)
 *
 * This class allows the angular dependency injector to differentiate between the two.
 *
 * THIS observable service (DiagramClientTupleOfflineObservable)
 * will get data from the caches setup in the client service.
 *
 * The more standard one (TupleDataOfflineObserverService) will use the Observable
 * proxy in the client service which proxies on to get data from the server. (standard)
 *
 */
@Injectable()
export class DiagramClientTupleOfflineObservable extends TupleDataOfflineObserverService {

    constructor(vortexService: VortexService,
                vortexStatusService: VortexStatusService,
                zone: NgZone,
                tupleOfflineStorageService: TupleOfflineStorageService) {
        super(vortexService, vortexStatusService, zone,
            new TupleDataObservableNameService(diagramClientObservableName, diagramFilt),
            tupleOfflineStorageService);

    }
}