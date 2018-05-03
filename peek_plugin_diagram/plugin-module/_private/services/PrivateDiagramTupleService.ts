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
    VortexStatusService,
    TupleDataObserverService
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
    public tupleObserver: TupleDataObserverService;


    constructor(tupleActionSingletonService: TupleActionPushOfflineSingletonService,
                vortexService: VortexService,
                vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService) {


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
            tupleDataObservableName,
            tupleOfflineStorageService);

        this.tupleObserver = new TupleDataObserverService(
            this.tupleOfflineObserver,
            tupleDataObservableName
        );


        this.tupleOfflineAction = new TupleActionPushOfflineService(
            tupleActionName,
            vortexService,
            vortexStatusService,
            tupleActionSingletonService);

    }


}