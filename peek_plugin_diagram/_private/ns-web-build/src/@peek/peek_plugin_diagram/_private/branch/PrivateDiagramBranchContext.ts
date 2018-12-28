import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {VortexStatusService} from "@synerty/vortexjs";
import {DiagramBranchService} from "../../DiagramBranchService";
import {DiagramBranchTuple} from "./DiagramBranchTuple";
import {DiagramBranchContext, DiagramBranchLocation} from "../../DiagramBranchContext";
import {DiagramDeltaBase} from "../../branch/DiagramDeltaBase";

/** Diagram Branch Service
 *
 * This is the implementation of the diagram branch service.
 *
 */
@Injectable()
export class PrivateDiagramBranchContext extends DiagramBranchContext {


    constructor(private branch: DiagramBranchTuple) {
        super();

    }

    get modelSetKey(): string {
        return this.branch.modelSetKey;
    }

    get coordSetKey(): string {
        return this.branch.coordSetKey;
    }

    get key(): string {
        return this.branch.key;
    }

    get deltas(): DiagramDeltaBase[] {
        return this.branch.deltas.slice();
    }

    addDelta(delta: DiagramDeltaBase): void {
        this.branch.deltas.push(delta);

    }

    save(): Promise<void> {
        return Promise.reject("DiagramBranchContext.save is not implemented");
    }

    setVisible(visible: boolean): void {
        this.branch.visible = visible;
    }


}