import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../_private/PluginNames";


@addTupleType
export class DiagramCoordSetTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramCoordSetTuple";

    key: string;
    name: string;
    enabled: boolean;

    constructor() {
        super(DiagramCoordSetTuple.tupleName)
    }
}