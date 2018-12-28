import {Observable} from "rxjs/Observable";
import {DiagramBranchContext, DiagramBranchLocation} from "./branch/DiagramBranchContext";

/** Diagram Branch Service
 *
 * This class can create/get/delete DiagramBranch objects
 *
 */
export abstract class DiagramBranchService {

    abstract getOrCreateBranch(modelSetKey: string,
                               coordSetKey: string,
                               branchKey: string,
                               location: DiagramBranchLocation): Promise<DiagramBranchContext>;


    abstract startEditing(modelSetKey: string,
                          coordSetKey: string,
                          branchKey: string,
                          location: DiagramBranchLocation): void;

    abstract stopEditing(): void;

}