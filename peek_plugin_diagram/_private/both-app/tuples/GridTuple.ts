import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../../../plugin-module/_private/PluginNames";


@addTupleType
export class GridTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "GridTuple";

    gridKey: string;
    blobData: string;
    lastUpdate: Date;

    constructor() {
        super(GridTuple.tupleName)
    }
}