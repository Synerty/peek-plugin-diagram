import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "@peek/peek_plugin_diagram/_private";


@addTupleType
export class ModelCoordSet extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "ModelCoordSet";

    id: number;
    name: string;
    initialPanX: number;
    initialPanY: number;
    initialZoom: number;
    enabled: boolean;

    comment: string;

    modelSetId:number;

    constructor() {
        super(ModelCoordSet.tupleName)
    }
}