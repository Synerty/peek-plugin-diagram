import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class DiagramLoaderStatusTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramLoaderStatusTuple";

    displayCompilerQueueStatus: boolean;
    displayCompilerQueueSize: number;
    displayCompilerProcessedTotal: number;
    displayCompilerLastError: string;

    gridCompilerQueueStatus: boolean;
    gridCompilerQueueSize: number;
    gridCompilerQueueProcessedTotal: number;
    gridCompilerQueueLastError: string;

    constructor() {
        super(DiagramLoaderStatusTuple.tupleName)
    }
}