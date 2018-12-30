import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";


@addTupleType
export class DiagramImporterStatusTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramImporterStatusTuple";

    displayCompilerQueueStatus: boolean;
    displayCompilerQueueSize: number;
    displayCompilerProcessedTotal: number;
    displayCompilerLastError: string;

    gridCompilerQueueStatus: boolean;
    gridCompilerQueueSize: number;
    gridCompilerQueueProcessedTotal: number;
    gridCompilerQueueLastError: string;

    locationIndexCompilerQueueStatus: boolean;
    locationIndexCompilerQueueSize: number;
    locationIndexCompilerQueueProcessedTotal: number;
    locationIndexCompilerQueueLastError: string;

    branchIndexCompilerQueueStatus: boolean;
    branchIndexCompilerQueueSize: number;
    branchIndexCompilerQueueProcessedTotal: number;
    branchIndexCompilerQueueLastError: string;

    constructor() {
        super(DiagramImporterStatusTuple.tupleName)
    }
}