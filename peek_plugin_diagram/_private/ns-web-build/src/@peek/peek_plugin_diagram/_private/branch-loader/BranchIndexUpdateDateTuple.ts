import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class BranchIndexUpdateDateTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "BranchIndexUpdateDateTuple";

    // Improve performance of the JSON serialisation
    protected _rawJonableFields = ['initialLoadComplete', 'updateDateByChunkKey'];

    initialLoadComplete: boolean = false;
    updateDateByChunkKey: {} = {};

    constructor() {
        super(BranchIndexUpdateDateTuple.tupleName)
    }
}