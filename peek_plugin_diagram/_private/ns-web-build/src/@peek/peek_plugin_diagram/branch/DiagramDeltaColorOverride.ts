import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../_private";
import {DiagramDeltaBase} from "./DiagramDeltaBase";

/** Diagram Delta Color Override Tuple
 *
 * This delta applies an override colour to a set of display keys
 *
 */
@addTupleType()
export class DiagramDeltaColorOverride extends DiagramDeltaBase {
    public static readonly tupleName = diagramTuplePrefix + "DiagramDeltaColorOverride";

    /** The type of this delta */
    public readonly type: number;

    constructor() {
        super(DiagramDeltaBase.TYPE_COLOUR_OVERRIDE,
            DiagramDeltaColorOverride.tupleName);
    }



}
