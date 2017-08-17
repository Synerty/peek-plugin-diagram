import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class DiagramCoordSetTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramCoordSetTuple";

    id: number;
    name: string;

    constructor() {
        super(DiagramCoordSetTuple.tupleName)
    }
}