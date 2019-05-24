import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class OfflineConfigTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "OfflineConfigTuple";

    cacheChunksForOffline: boolean = false;

    constructor() {
        super(OfflineConfigTuple.tupleName)
    }
}
