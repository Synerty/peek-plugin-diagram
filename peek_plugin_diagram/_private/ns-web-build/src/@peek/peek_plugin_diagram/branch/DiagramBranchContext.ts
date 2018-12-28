import {DiagramDeltaBase} from "./branch_deltas/DiagramDeltaBase";


/** Diagram Branch Service Enum
 *
 * This enum describes the location of the branch,
 * is the branch local to the UI, or is it persisted on the server.
 *
 */
export enum DiagramBranchLocation {
    ServerBranch,
    LocalBranch
}

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


    /** Set Visible
     *
     * Set
     *
     * @param enabled: Is this branch visib
     */
    abstract setVisible(visible: boolean): void;


}