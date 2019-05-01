import {Injectable} from "@angular/core";
import {TupleStorageServiceABC} from "@synerty/vortexjs/src/vortex/storage/TupleStorageServiceABC";
import {TupleOfflineStorageNameService} from "@synerty/vortexjs/src/vortex/storage/TupleOfflineStorageNameService";
import {TupleStorageFactoryService} from "@synerty/vortexjs/src/vortex/storage-factory/TupleStorageFactoryService";
import {TupleActionStorageServiceABC} from "@synerty/vortexjs/src/vortex/action-storage/TupleActionStorageServiceABC";
import {TupleStorageBridgeWeb} from "../service-bridge/TupleStorageBridgeWeb";

// import {TupleActionStorageIndexedDbService} from "@synerty/vortexjs/src/vortex/action-storage/TupleActionStorageIndexedDbService";

@Injectable({
    providedIn: 'root'
})
export class TupleStorageFactoryServiceBridgeWeb extends TupleStorageFactoryService {

    private offlineStorageNameServices
        : { [name: string]: TupleOfflineStorageNameService } = {};

    constructor() {
        let nothing: any = null;
        super(nothing);
    }

    create(name: TupleOfflineStorageNameService): TupleStorageServiceABC {
        let dict = this.offlineStorageNameServices;
        if (dict[name] == null)
            dict[name] = new TupleStorageBridgeWeb(name);

        return dict[name];
    }

    createActionStorage(): TupleActionStorageServiceABC {
        throw new Error("Action storage not implemented yet");
    }
}

