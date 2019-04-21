import {BranchTuple} from "./BranchTuple";
import {DiagramDeltaBase} from "../../branch/DiagramDeltaBase";
import {DiagramBranchContext} from "../../branch/DiagramBranchContext";
import {DiagramLookupService} from "../../DiagramLookupService";

/** Diagram Branch Service
 *
 * This is the implementation of the diagram branch service.
 *
 */
export class PrivateDiagramBranchContext extends DiagramBranchContext {


    constructor(private lookupCache: DiagramLookupService,
                private branch: BranchTuple,
                private _modelSetKey: string,
                private _coordSetKey: string) {
        super();

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

    save(): Promise<void> {
        return Promise.reject("PrivateDiagramBranchContext.save is not implemented");
    }

    setVisible(visible: boolean): void {
        this.branch.visible = visible;
    }

    get location(): DiagramBranchContext {
        return undefined;
    }



}