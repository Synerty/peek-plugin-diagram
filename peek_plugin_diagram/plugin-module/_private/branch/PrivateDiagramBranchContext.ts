import {BranchTuple} from "./BranchTuple";
import {DiagramLookupService} from "../../DiagramLookupService";


export interface _BranchContextSaveCallback {
    (context: any): Promise<void>;
}

/** Diagram Branch Service
 *
 * This is the implementation of the diagram branch service.
 *
 */
export class PrivateDiagramBranchContext {


    constructor(private lookupCache: DiagramLookupService,
                private branch: BranchTuple,
                private _modelSetKey: string,
                private _coordSetKey: string,
                private saveCallback: _BranchContextSaveCallback) {

    }

    get branchTuple(): BranchTuple {
        return this.branch;
    }

    get modelSetKey(): string {
        return this._modelSetKey;
    }

    get coordSetKey(): string {
        return this._coordSetKey;
    }

    get key(): string {
        return this.branch.key;
    }

    save(): Promise<void> {
        return this.saveCallback(this);
    }

    setVisible(visible: boolean): void {
        this.branch.visible = visible;
    }


}