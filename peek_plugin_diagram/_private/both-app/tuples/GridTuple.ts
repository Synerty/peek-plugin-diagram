import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "@peek/peek_plugin_diagram/_private";


@addTupleType
export class GridTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "GridTuple";

    gridKey: string;
    // The compressed (deflated) json string.
    blobData: string | null;
    lastUpdate: string;

    // This is populated when the grid gets to the client.
    // This way, when the grid is stored in tuple storage, there only needs to be one
    // string inflate (decompress)
    dispJsonStr: string | null;

    constructor() {
        super(GridTuple.tupleName)
    }
}