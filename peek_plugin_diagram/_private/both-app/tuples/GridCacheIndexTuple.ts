import { addTupleType, Tuple } from "@synerty/vortexjs";
import { diagramTuplePrefix } from "@peek/peek_plugin_diagram/_private";


// ----------------------------------------------------------------------------
/** Grid Cache Index
 *
 * The index is probably a terrible name.
 *
 * This tuple stores the updateDate for all grids cached in the database.
 *
 */
@addTupleType
export class GridCacheIndexTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "GridCacheIndexTuple";

    // Improve performance of the JSON serialisation
    protected _rawJonableFields = ['data'];

    data: { [gridKey: string]: string } = {};

    constructor() {
        super(GridCacheIndexTuple.tupleName)
    }


}

