import {DiagramDeltaBase} from "./DiagramDeltaBase";
// Ensure the deltas are registered
import "./DiagramDeltaColorOverride";
import "./DiagramDeltaCreateDisp"


import {BranchLocation} from "@peek/peek_plugin_branch"

/** Diagram Branch Context
 *
 * This class represents the context for manipulating a branch.
 *
 */
export abstract class DiagramBranchContext {

    /** Model Set Key */
    abstract get modelSetKey(): string;

    /** Coord Set Key */
    abstract get coordSetKey(): string;

    /** Key
     *
     * The key of this branch
     */
    abstract get key(): string;

    /** Location
     *
     * The location of this branch
     */
    abstract get location(): BranchLocation;

    /** Save
     *
     * Save the branch.
     *
     * This applies if the branch is a server stored branch.
     */
    abstract save(): Promise<void> ;


    /** Deltas
     *
     * @returns a list of the DiagramDelta classes.
     */
    abstract get deltas(): DiagramDeltaBase[];

    /** addDelta
     *
     * Use this method to add a delta to the branch.
     *
     * The delta will be applied sequentially, meaning it can apply to deltas applied
     * before it.
     *
     * @param delta: The delta to add.
     */
    abstract addDelta(delta: DiagramDeltaBase): void ;

    /** Create or Reuse Delta
     *
     * Use this method to return a newly created delta or reuse the last delta
     * if it's the same type.
     *
     * @param DiagramDeltaBase: A class deriving DiagramDeltaBase, not an instance.
     * @returns An instance of the Delta class
     */
    abstract createOrReuseDelta(DiagramDeltaBase): DiagramDeltaBase;


    /** Set Visible
     *
     * Set
     *
     * @param enabled: Is this branch visib
     */
    abstract setVisible(visible: boolean): void;


}