import {BranchDetailTuple} from "@peek/peek_plugin_branch";


/** Diagram Branch Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
export abstract class DiagramBranchService {

    constructor() {

    }

    abstract setVisibleBranches(commonBranches: BranchDetailTuple[]): void ;

    abstract getBranchAnchorKeys(modelSetKey: string, coordSetKey: string,
                                 branchKey: string): Promise<string[]> ;

    abstract startEditing(modelSetKey: string, coordSetKey: string,
                                 branchKey: string):Promise<void>

}