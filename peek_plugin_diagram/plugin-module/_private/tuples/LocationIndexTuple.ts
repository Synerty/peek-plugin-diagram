import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "@peek/peek_plugin_diagram/_private";


@addTupleType
export class LocationIndexTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "LocationIndexTuple";

    modelSetKey: string;
    indexBucket: string;

    // The compressed (deflated) json string.
    blobData: string | null;
    lastUpdate: string;

    // A compressed payload of... this tuple, it's a little recursive.
    // This removes the need for the client to convert the
    // tuple to a vortexMsg in saveTuple
    encodedThisTuple: string;


    constructor() {
        super(LocationIndexTuple.tupleName)
    }
}
