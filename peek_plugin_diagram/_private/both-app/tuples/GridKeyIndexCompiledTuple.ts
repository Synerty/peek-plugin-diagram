import {addTupleType, Tuple} from "@synerty/vortexjs";

@addTupleType
export class GridKeyIndexCompiledTuple extends Tuple {
    static readonly tupleName = 'c.s.p.disp.grid.index.update';

    gridKey :string;
    blobData :string;
    lastUpdate :Date;
    coordSetId :number;

    constructor() {
        super(GridKeyIndexCompiledTuple.tupleName);
    }
}