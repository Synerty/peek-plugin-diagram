import {Injectable, NgZone} from "@angular/core";
import {
    TupleActionPushNameService,
    TupleActionPushOfflineService,
    TupleActionPushOfflineSingletonService,
    TupleDataObservableNameService,
    TupleDataOfflineObserverService,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService,
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";

import {
    diagramActionProcessorName,
    diagramFilt,
    diagramObservableName,
    diagramTupleOfflineServiceName
} from "@peek/peek_plugin_diagram/_private/PluginNames";


@Injectable()
export class PrivateDiagramTupleServiceWeb {
    public tupleOfflineObserver: TupleDataOfflineObserverService;


    constructor(vortexService: VortexService,
                vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService,
                zone: NgZone) {


        let tupleDataObservableName = new TupleDataObservableNameService(
            diagramObservableName, diagramFilt);
        let storageName = new TupleOfflineStorageNameService(
            diagramTupleOfflineServiceName);
        let tupleActionName = new TupleActionPushNameService(
            diagramActionProcessorName, diagramFilt);

        let tupleOfflineStorageService = new TupleOfflineStorageService(
            storageFactory, storageName);

        this.tupleOfflineObserver = new TupleDataOfflineObserverService(
            vortexService,
            vortexStatusService,
            zone,
            tupleDataObservableName,
            tupleOfflineStorageService);

        //
        // this.tupleOfflineAction = new TupleActionPushOfflineService(
        //     tupleActionName,
        //     vortexService,
        //     vortexStatusService,
        //     tupleActionSingletonService);

    }

    get tupleOfflineAction() :TupleActionPushOfflineService {
        throw new Error("tupleOfflineAction is not implemented");
    }


}