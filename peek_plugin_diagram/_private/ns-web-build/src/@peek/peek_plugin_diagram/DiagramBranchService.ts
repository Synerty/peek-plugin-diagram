import {Observable} from "rxjs/Observable";
import {DiagramBranchContext} from "./branch/DiagramBranchContext";

import {BranchLocation} from "@peek/peek_plugin_branch/";

/** Diagram Branch Service
 *
 * This class can create/get/delete DiagramBranch objects
 *
 */
export abstract class DiagramBranchService {

    abstract getOrCreateBranch(modelSetKey: string,
                               coordSetKey: string,
                               branchKey: string,
                               location: BranchLocation): Promise<DiagramBranchContext>;


    abstract startEditing(modelSetKey: string,
                          coordSetKey: string,
                          branchKey: string,
                          location: BranchLocation): void;

    abstract stopEditing(): void;

}