import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {
    BRANCH_DELTA_CLASSES_BY_TYPE,
    DiagramDeltaBase
} from "../../branch/DiagramDeltaBase";
import {DiagramLookupCache} from "../../DiagramLookupCache";

/** Diagram Branch Tuple
 *
 * This tuple is used internally to transfer branches from the client tuple provider,
 * and transfer branches to the client wrapped in a TupleAction.
 *
 */
@addTupleType
export class BranchTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "BranchTuple";

    // The list of deltas for this branch
    packedJson__: any[] = [];

    private static readonly __COORD_SET_ID_NUM = 0;
    private static readonly __KEY_NUM = 1;
    private static readonly __DELTAS_NUM = 2;
    private static readonly __VISIBLE_NUM = 3;

    constructor() {
        super(BranchTuple.tupleName)
    }

    static unpackJson(key: string, packedJsonStr: string): BranchTuple {

        // Create the new object
        let newSelf = new BranchTuple();
        newSelf.packedJson__ = JSON.parse(packedJsonStr);
        newSelf.packedJson__[BranchTuple.__KEY_NUM] = key;
        return newSelf;

    }

    get coordSetId(): number {
        return this.packedJson__[BranchTuple.__COORD_SET_ID_NUM];
    }

    get key(): string {
        return this.packedJson__[BranchTuple.__KEY_NUM];
    }

    deltas(lookupCache: DiagramLookupCache): DiagramDeltaBase[] {
        let deltasJson = this.packedJson__[BranchTuple.__DELTAS_NUM];
        let deltas = [];
        for (let deltaJson of deltasJson) {
            let deltaType = deltaJson[0];
            let Delta = BRANCH_DELTA_CLASSES_BY_TYPE[deltaType];
            let delta = new Delta();
            delta._jsonData = deltaJson;
            delta.__link(lookupCache);
            deltas.push(delta);
        }
        return deltas;
    }

    addDelta(delta: DiagramDeltaBase): void {
        if (this.packedJson__[BranchTuple.__DELTAS_NUM] == null)
            this.packedJson__[BranchTuple.__DELTAS_NUM] = [];
        this.packedJson__[BranchTuple.__DELTAS_NUM].push(delta["_deltaJson"])
    }

    set visible(value: boolean) {
        this.packedJson__[BranchTuple.__VISIBLE_NUM] = value;
    }

    get visible(): boolean {
        return this.packedJson__[BranchTuple.__VISIBLE_NUM];
    }
}