import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class DiagramTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramTuple";

    //  Description of date1
    dict1 : {};

    //  Description of array1
    array1 : any[];

    //  Description of date1
    date1 : Date;

    constructor() {
        super(DiagramTuple.tupleName)
    }
}