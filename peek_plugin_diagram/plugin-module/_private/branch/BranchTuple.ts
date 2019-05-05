import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {
    BRANCH_DELTA_CLASSES_BY_TYPE,
    DiagramDeltaBase
} from "../../branch/DiagramDeltaBase";
import {DiagramLookupService} from "../../DiagramLookupService";

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

    private static readonly __ID_NUM = 0;
    private static readonly __COORD_SET_ID_NUM = 1;
    private static readonly __KEY_NUM = 2;
    private static readonly __VISIBLE_NUM = 3;
    private static readonly __UPDATED_DATE = 4;
    private static readonly __CREATED_DATE = 5;
    private static readonly __DELTAS_JSON_NUM = 6;
    private static readonly __UPDATED_DISPS_JSON_NUM = 7;
    private static readonly __NEW_DISPS_JSON_NUM = 8;
    private static readonly __DELETED_DISP_IDS_NUM = 9;

    private _newDispNextTempId = 1;

    private _newDispByTempId = {};
    private _updatedDispIds = {};

    constructor() {
        super(BranchTuple.tupleName)
    }

    static createBranch(coordSetId: number, branchKey: string): any {
        let date = new Date();
        let branch = new BranchTuple();
        branch.packedJson__[BranchTuple.__COORD_SET_ID_NUM] = coordSetId;
        branch.packedJson__[BranchTuple.__KEY_NUM] = branchKey;
        branch.packedJson__[BranchTuple.__VISIBLE_NUM] = true;
        branch.packedJson__[BranchTuple.__UPDATED_DATE] = date;
        branch.packedJson__[BranchTuple.__CREATED_DATE] = date;
        branch.packedJson__[BranchTuple.__DELTAS_JSON_NUM] = [];
        branch.packedJson__[BranchTuple.__UPDATED_DISPS_JSON_NUM] = [];
        branch.packedJson__[BranchTuple.__NEW_DISPS_JSON_NUM] = [];
        branch.packedJson__[BranchTuple.__DELETED_DISP_IDS_NUM] = [];
        return branch;
    }

    static unpackJson(packedJsonStr: string): BranchTuple {

        // Create the new object
        let newSelf = new BranchTuple();
        newSelf.packedJson__ = JSON.parse(packedJsonStr);

        for (let disp of newSelf._array(BranchTuple.__NEW_DISPS_JSON_NUM)) {
            disp.__newTempId = newSelf._newDispNextTempId++;
            newSelf._newDispByTempId[disp.__newTempId] = disp;
        }

        for (let disp of newSelf._array(BranchTuple.__UPDATED_DISPS_JSON_NUM)) {
            newSelf._updatedDispIds[disp.id] = true;
        }

        return newSelf;

    }

    private _array(num: number): any[] {
        if (this.packedJson__[num] == null)
            this.packedJson__[num] = [];
        return this.packedJson__[num];
    }

    get id(): number {
        return this.packedJson__[BranchTuple.__ID_NUM];
    }

    get coordSetId(): number {
        return this.packedJson__[BranchTuple.__COORD_SET_ID_NUM];
    }

    get key(): string {
        return this.packedJson__[BranchTuple.__KEY_NUM];
    }

    deltas(lookupCache: DiagramLookupService): DiagramDeltaBase[] {
        let deltasJson = this.packedJson__[BranchTuple.__DELTAS_JSON_NUM];
        if (deltasJson == null)
            return [];

        let deltas = [];
        for (let deltaJson of deltasJson) {
            let deltaType = deltaJson[0];
            let Delta = BRANCH_DELTA_CLASSES_BY_TYPE[deltaType];
            let delta = new Delta();
            delta._jsonData = deltaJson;
            delta.__linkDispLookups(lookupCache);
            deltas.push(delta);
        }
        return deltas;
    }

    createOrUpdateDisp(disp: any): void {
        if (disp.id == null)
            this.addNewDisp(disp);
        else
            this.addUpdatedDisp(disp);

    }

    addDelta(delta: DiagramDeltaBase): void {
        this.touchUpdateDate();
        this._array(BranchTuple.__DELTAS_JSON_NUM).push(delta["_jsonData"]);
    }

    deleteDisp(dispId: number): void {
        this.addDeletedDispId(dispId);
    }

    private addUpdatedDisp(disp: any): void {
        this.touchUpdateDate();
        let array = this._array(BranchTuple.__UPDATED_DISPS_JSON_NUM);

        // If the ID has already been added, then an update isn't needed.
        if (this._updatedDispIds[disp.id] != null)
            return;

        this._updatedDispIds[disp.id] = true;
        array.push(disp);
    }

    private addNewDisp(disp: any): void {
        let array = this._array(BranchTuple.__NEW_DISPS_JSON_NUM);
        this.touchUpdateDate();

        // If the ID has already been added, then an update isn't needed.
        if (disp.__newTempId != null)
            return;

        disp.__newTempId = this._newDispNextTempId++;
        this._newDispByTempId[disp.__newTempId] = disp;
        array.push(disp);
    }

    private addDeletedDispId(dispId: number): void {
        this._array(BranchTuple.__DELETED_DISP_IDS_NUM).push(dispId);
        this.touchUpdateDate();
    }

    touchUpdateDate(): void {
        this.packedJson__[BranchTuple.__UPDATED_DATE] = new Date();
    }

    set visible(value: boolean) {
        this.packedJson__[BranchTuple.__VISIBLE_NUM] = value;
    }

    get visible(): boolean {
        return this.packedJson__[BranchTuple.__VISIBLE_NUM];
    }

    get updatedDate(): Date {
        return this.packedJson__[BranchTuple.__UPDATED_DATE];
    }

    get createdDate(): Date {
        return this.packedJson__[BranchTuple.__CREATED_DATE];
    }

    /** These methods are used to help render the branch */

    /** RENDER DispIDs to Exlucde
     *
     */
    get renderDispIdsToExclude():number[] {
        return [...Object.keys(this._updatedDispIds),
            ...this._array(BranchTuple.__DELETED_DISP_IDS_NUM)];
    }

    /** RENDER Disps to Include
     *
     */
    get renderDispsToInclude():number[] {
        return this._array(BranchTuple.__NEW_DISPS_JSON_NUM);
    }
}