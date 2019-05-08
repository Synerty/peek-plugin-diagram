/** Delta Base
 *
 * Static accessors, the code is structured to use these static accessor classes to
 * improve the performance of rendering.
 *
 * Rendering will require a smaller memory footprint, and no class instantiation to
 * access the json data, just like the diffs.
 *
 * This is the base class of all diagram deltas.
 *
 *
 */
import {Tuple} from "@synerty/vortexjs";

export enum DiagramOverrideTypeE {
    Color
}

export abstract class DiagramOverrideBase extends Tuple {

    private type_: number;

    constructor(tupleType: string, type: DiagramOverrideTypeE) {
        super(tupleType);
        this.type_ = type;
    }

    get overrideType(): DiagramOverrideTypeE {
        return this.type_;
    }
}