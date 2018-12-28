import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {DiagramDeltaBase} from "../../branch/DiagramDeltaBase";


@addTupleType
export class DiagramBranchTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramBranchTuple";

    modelSetKey: string;
    coordSetKey: string;
    key: string;

    deltas: DiagramDeltaBase[] = [];

    // Properties
    visible: boolean = false;

    constructor() {
        super(DiagramBranchTuple.tupleName)
    }
}