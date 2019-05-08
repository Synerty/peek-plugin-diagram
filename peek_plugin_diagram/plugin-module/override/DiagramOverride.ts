import "./DiagramDeltaColorOverride";

import {diagramTuplePrefix} from "../_private";
import {addTupleType, Tuple} from "@synerty/vortexjs";
import {DiagramOverrideBase} from "./DiagramOverrideBase";


/** Diagram Override Tuple
 *
 * This tuple is used internally to transfer branches from the client tuple provider,
 * and transfer branches to the client wrapped in a TupleAction.
 *
 */
@addTupleType
export class DiagramOverride extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramOverrideTuple";

    private modelSetKey_: string;
    private coordSetKey_: string;
    private overrides_: DiagramOverrideBase[] = [];

    /** Model Set Key */
    get modelSetKey(): string {
        return this.modelSetKey_;

    }

    /** Coord Set Key */
    get coordSetKey(): string {
        return this.coordSetKey_;

    }

    addOverride(override: DiagramOverrideBase): void {
        this.overrides_.push(override);

    }


}