import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {
    BRANCH_DELTA_CLASSES_BY_TYPE,
    DiagramDeltaBase
} from "../../branch/DiagramDeltaBase";
import {ModelSet} from "@peek/peek_plugin_diagram";
import {BranchDeltaBase} from "@peek/peek_plugin_diagram/branch";
import {DiagramCoordSetTuple} from "../..";

/** Diagram Branch Tuple
 *
 * This tuple is used internally to transfer branches from the client tuple provider,
 * and transfer branches to the client wrapped in a TupleAction.
 *
 */
@addTupleType
export class DiagramBranchTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramBranchTuple";

    coordSetKey: string;
    coordSetId: number;

    key: string;

    // The list of deltas for this branch
    _packedJson: any[] = [];

    // Properties
    visible: boolean = false;

    private static readonly __COORD_SET_NUM = 0;
    private static readonly __DELTAS_NUM = 1;
    private static readonly __VISIBLE_NUM = 2;

    constructor() {
        super(DiagramBranchTuple.tupleName)
    }

    static unpackJson(key: string, packedJsonStr: string): DiagramBranchTuple {

        // Create the new object
        let newSelf = new DiagramBranchTuple();
        newSelf._packedJson = JSON.parse(packedJsonStr);
        newSelf.key = key;
        return newSelf;

    }

    get coordSetId(): number {
        return this._packedJson[DiagramBranchTuple.__COORD_SET_NUM];
    }

    get deltas(): DiagramDeltaBase[] {
        let deltasJson = this._packedJson[DiagramBranchTuple.__DELTAS_NUM];
        let deltas = [];
        for (let deltaJson of deltasJson) {
            let deltaType = deltaJson[0];
            let Delta = BRANCH_DELTA_CLASSES_BY_TYPE[deltaType];
            let delta = Delta();
            delta._jsonData = deltaJson;
            deltas.push(delta);
        }
        return deltas;
    }

    addDelta(delta: BranchDeltaBase): void {
        this.deltas.push(delta["_deltaJson"])

    }

    get visible(): boolean {
        return this._packedJson[DiagramBranchTuple.__VISIBLE_NUM];
    }
}