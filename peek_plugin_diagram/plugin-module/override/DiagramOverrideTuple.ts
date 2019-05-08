import "./DiagramDeltaColorOverride";

import {diagramTuplePrefix} from "../_private";
import {addTupleType, Tuple} from "@synerty/vortexjs";


/** Diagram Override Tuple
 *
 * This tuple is used internally to transfer branches from the client tuple provider,
 * and transfer branches to the client wrapped in a TupleAction.
 *
 */
@addTupleType
export class DiagramOverrideTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramOverrideTuple";

    /** Model Set Key */
    abstract get modelSetKey(): string;

    /** Coord Set Key */
    abstract get coordSetKey(): string;

    /** Key
     *
     * The key of this branch
     */
    abstract get key(): string;


    /** Set Visible
     *
     * Set
     *
     * @param enabled: Is this branch visib
     */
    abstract setVisible(visible: boolean): void;


}