import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {BranchTuple} from "./BranchTuple";


/** Branch Live Edit Tuple
 *
 * This tuple is used internally to transfer branches between UIs that are actively
 * editing the.
 *
 * This isn't stored anywhere, it just gets relayed between multiple UIs.
 *
 */
@addTupleType
export class BranchLiveEditTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "BranchLiveEditTuple";

    branchTuple: BranchTuple = null;
    updatedByUser: string = null;

    uiUpdateDate: Date = null;
    serverUpdateDate: Date = null;

    updateFromSave: boolean = false;

    constructor() {
        super(BranchLiveEditTuple.tupleName);
    }

}