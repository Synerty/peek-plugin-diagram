import {Injectable} from "@angular/core";
import {TupleStorageServiceABC} from "@synerty/vortexjs/src/vortex/storage/TupleStorageServiceABC";
import {TupleOfflineStorageNameService} from "@synerty/vortexjs/src/vortex/storage/TupleOfflineStorageNameService";
import {TupleStorageIndexedDbService} from "@synerty/vortexjs/src/vortex/storage/TupleStorageIndexedDbService";
import {TupleStorageWebSqlService} from "@synerty/vortexjs/src/vortex/storage/TupleStorageWebSqlService";
import {TupleStorageNullService} from "@synerty/vortexjs/src/vortex/storage/TupleStorageNullService";
import {TupleStorageFactoryService} from "@synerty/vortexjs/src/vortex/storage-factory/TupleStorageFactoryService";
import {TupleActionStorageServiceABC} from "@synerty/vortexjs/src/vortex/action-storage/TupleActionStorageServiceABC";
import {supportsIndexedDb} from "@synerty/vortexjs/src/vortex/storage/IndexedDb";
import {TupleStorageBridgeWeb} from "../service-bridge/TupleStorageBridgeWeb";
// import {TupleActionStorageIndexedDbService} from "@synerty/vortexjs/src/vortex/action-storage/TupleActionStorageIndexedDbService";

@Injectable()
export class TupleStorageFactoryServiceBridgeWeb extends TupleStorageFactoryService {

    constructor() {
        let nothing:any = null;
        super(nothing);
    }

    create(name: TupleOfflineStorageNameService): TupleStorageServiceABC {
        return new TupleStorageBridgeWeb(name);
    }

    createActionStorage(): TupleActionStorageServiceABC {
        throw new Error("Action storage not implemented yet");
    }
}

