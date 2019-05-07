import {BranchTuple} from "./BranchTuple";
import {DiagramDeltaBase} from "../../branch/DiagramDeltaBase";
import {DiagramBranchContext} from "../../branch/DiagramBranchContext";
import {DiagramLookupService} from "../../DiagramLookupService";
import {BranchLocation} from "@peek/peek_plugin_branch";


export interface _BranchContextSaveCallback {
    (context: any): Promise<void>;
}

/** Diagram Branch Service
 *
 * This is the implementation of the diagram branch service.
 *
 */
export class PrivateDiagramBranchContext extends DiagramBranchContext {


    constructor(private lookupCache: DiagramLookupService,
                private branch: BranchTuple,
                private _modelSetKey: string,
                private _coordSetKey: string,
                private saveCallback: _BranchContextSaveCallback,
                private _location: BranchLocation) {
        super();

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

    get deltas(): DiagramDeltaBase[] {
        return this.branch.deltas(this.lookupCache);
    }

    addDelta(delta: DiagramDeltaBase): void {
        this.branch.addDelta(delta);

    }

    createOrReuseDelta(DeltaClass): any {
        let newDelta = new DeltaClass();
        let deltaType = newDelta.type;

        if (this.deltas.length != 0 && this.deltas[this.deltas.length - 1].type == deltaType) {
            let delta: any = this.deltas[this.deltas.length - 1];
            return delta;
        }

        this.addDelta(newDelta);
        return newDelta;
    }

    createOrUpdateDisp(disp: any): void {
        this.branchTuple.createOrUpdateDisp(disp);
    }

    deleteDisp(dispId: number): void {
        this.branchTuple.deleteDisp(dispId);
    }

    save(): Promise<void> {
        return this.saveCallback(this);
    }

    setVisible(visible: boolean): void {
        this.branch.visible = visible;
    }

    get location(): BranchLocation {
        return this._location;
    }


}