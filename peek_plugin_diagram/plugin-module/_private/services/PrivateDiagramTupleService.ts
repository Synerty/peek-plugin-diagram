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
} from "../PluginNames";


@Injectable()
export class PrivateDiagramTupleService {
    public tupleOfflineAction: TupleActionPushOfflineService;
    public tupleOfflineObserver: TupleDataOfflineObserverService;


    constructor(tupleActionSingletonService: TupleActionPushOfflineSingletonService,
                vortexService: VortexService,
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


        this.tupleOfflineAction = new TupleActionPushOfflineService(
            tupleActionName,
            vortexService,
            vortexStatusService,
            tupleActionSingletonService);

    }


}