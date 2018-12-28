import {Tuple} from "@synerty/vortexjs";

/** Diagram Delta Tuple
 *
 * This is the base class of all diagram deltas.
 *
 */
export abstract class DiagramDeltaBase extends Tuple {
    static readonly TYPE_COLOUR_OVERRIDE = 1;

    /** The type of this delta */
    public readonly type: number;

    constructor(type: number, tupleName: string) {
        super(tupleName);
        this.type = type;
    }

}