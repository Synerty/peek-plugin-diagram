import {addTupleType, extend, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {DiagramLookupService} from "../../DiagramLookupService";
import {deepCopy} from "@synerty/vortexjs/src/vortex/UtilMisc";
import SerialiseUtil from "@synerty/vortexjs/src/vortex/SerialiseUtil";
import * as moment from "moment";


let serUril = new SerialiseUtil();

export enum BranchDispChangeE {
    create = 2,
    delete = 3
}

/** Diagram Branch Tuple
 *
 * This tuple is used internally to transfer branches from the client tuple provider,
 * and transfer branches to the client wrapped in a TupleAction.
 *
 */
@addTupleType
export class BranchTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "BranchTuple";

    protected _rawJonableFields = ['packedJson__'];

    // The list of deltas for this branch
    packedJson__: any[] = [];

    private static readonly __ID_NUM = 0;
    private static readonly __COORD_SET_ID_NUM = 1;
    private static readonly __KEY_NUM = 2;
    private static readonly __VISIBLE_NUM = 3;
    private static readonly __UPDATED_DATE = 4;
    private static readonly __CREATED_DATE = 5;
    private static readonly __DISPS_NUM = 6;
    private static readonly __ANCHOR_DISP_KEYS_NUM = 7;
    private static readonly __LAST_INDEX_NUM = 7;


    private _dispsById = {};
    private _lastStage = 1;
    private _contextUpdateCallback: ((modelUpdateRequired: boolean) => void) | null;


    constructor() {
        super(BranchTuple.tupleName);
        for (let i = this.packedJson__.length; i < BranchTuple.__LAST_INDEX_NUM + 1; i++)
            this.packedJson__.push(null);
    }

    static createBranch(coordSetId: number, branchKey: string): any {
        let branch = new BranchTuple();
        branch.packedJson__[BranchTuple.__ID_NUM] = null;
        branch.packedJson__[BranchTuple.__COORD_SET_ID_NUM] = coordSetId;
        branch.packedJson__[BranchTuple.__KEY_NUM] = branchKey;
        branch.packedJson__[BranchTuple.__VISIBLE_NUM] = true;
        branch.setUpdatedDate(null);
        branch.setCreatedDate(new Date());
        branch.packedJson__[BranchTuple.__DISPS_NUM] = [];
        branch.packedJson__[BranchTuple.__ANCHOR_DISP_KEYS_NUM] = [];
        return branch;
    }

    static unpackJson(packedJsonStr: string): BranchTuple {
        // Create the new object
        let newSelf = new BranchTuple();
        newSelf.packedJson__ = JSON.parse(packedJsonStr);
        newSelf.assignIdsToDisps();
        return newSelf;
    }

    private assignIdsToDisps(): void {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];
        let array = this._array(BranchTuple.__DISPS_NUM);
        for (let i = 0; i < array.length; ++i) {
            let disp = array[i];
            BranchTuple._setNewDispId(disp, i);
            this._dispsById[DispBase.id(disp)] = disp;
            if (this._lastStage < DispBase.branchStage(disp))
                this._lastStage = DispBase.branchStage(disp);
        }
    }

    private static _setNewDispId(disp, index): void {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];
        if (DispBase.id(disp) == null)
            DispBase.setId(disp, <any>`NEW_${(new Date()).getTime()}_${index}`);
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

    deleteDisp(dispId: number): void {
        // TODO
        // this._array(BranchTuple.__DELETED_DISP_IDS_NUM).push(dispId);
        // this.touchUpdateDate();
    }

    addStage(): number {
        return this._lastStage++;
    }

    /** Add or Update Disps
     *
     * This method adds an array of disps to the branch.
     *
     * @param disps: An array of disps to add.
     */
    addOrUpdateDisps(disps: any): any[] {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];

        let modelUpdateRequired = false;
        let returnedDisps = [];

        let oldDispIdMap = {};

        for (let disp of disps) {
            let result = this.addOrUpdateSingleDisp(disp);
            oldDispIdMap[disp.id] = result.disp.id;
            modelUpdateRequired = modelUpdateRequired || result.modelUpdateRequired;
            returnedDisps.push(result.disp);
        }

        for (let disp of returnedDisps) {
            let groupId = DispBase.groupId(disp);
            if (oldDispIdMap[groupId] != null)
                DispBase.setGroupId(disp, oldDispIdMap[groupId]);
        }

        this.touchUpdateDate(modelUpdateRequired);
        return returnedDisps;
    }

    /** Add or Update Disp
     *
     * This method adds the disp to the branch if it's new.
     *
     * If the disp is existing, but in a different stage, it clones and returns the disp
     * in the new stage.
     *
     * @param disp
     */
    addOrUpdateDisp(disp: any): any {
        let result = this.addOrUpdateSingleDisp(disp);
        this.touchUpdateDate(result.modelUpdateRequired);
        return result.disp;
    }

    private addOrUpdateSingleDisp(disp: any): { disp: any, modelUpdateRequired: boolean } {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];
        let DispGroupPointer = require("peek_plugin_diagram/tuples/shapes/DispGroupPointer")["DispGroupPointer"];
        let array = this._array(BranchTuple.__DISPS_NUM);

        let dispInBranch = this._dispsById[DispBase.id(disp)];

        // If the Disp has an ID and it's not in this branch, then:
        // 1) we make a copy of the disp
        // 2) we set its "replacesHashId" to the "hashId" it's replacing.
        if (DispBase.id(disp) != null && dispInBranch == null) {
            let branchDisp = extend({}, disp);
            DispBase.setReplacesHashId(branchDisp, DispBase.hashId(disp));
            DispGroupPointer.setTargetGroupId(branchDisp, null);
            DispBase.setId(branchDisp, null);
            disp = branchDisp;
        }

        BranchTuple._setNewDispId(disp, array.length);

        if (dispInBranch == null) {
            DispBase.setBranchStage(disp, this._lastStage);
            this._dispsById[DispBase.id(disp)] = disp;
            array.push(disp);
            return {disp: disp, modelUpdateRequired: true};
        }

        if (DispBase.branchStage(dispInBranch) == DispBase.branchStage(disp)) {
            return {disp: disp, modelUpdateRequired: false};
        }

        // Else, it's a new stage, clone the disp.

        this._dispsById[DispBase.id(disp)] = disp;
        array.push(disp);
        return {disp: disp, modelUpdateRequired: true};

    }

    /** Add New Disps
     *
     * This method adds newly created disps to tbe branch in bulk.
     *
     * @param disps
     */
    addNewDisps(disps: any[]): void {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];
        let array = this._array(BranchTuple.__DISPS_NUM);

        for (let disp of disps) {
            BranchTuple._setNewDispId(disp, array.length);
            DispBase.setBranchStage(disp, this._lastStage);
            this._dispsById[DispBase.id(disp)] = disp;
            array.push(disp);
        }
        this.touchUpdateDate(true);

    }

    removeDisps(disps: any[]): void {
        let DispBase = require("peek_plugin_diagram/tuples/shapes/DispBase")["DispBase"];
        let DispNull = require("peek_plugin_diagram/tuples/shapes/DispNull")["DispNull"];

        let dispIdsToRemove = {};
        for (let disp of disps) {
            dispIdsToRemove[DispBase.id(disp)] = disp;
        }

        let array = this._array(BranchTuple.__DISPS_NUM);

        this.packedJson__[BranchTuple.__DISPS_NUM] = array
            .filter(disp => {
                let id = DispBase.id(disp);
                if (dispIdsToRemove[id] != null) {
                    delete dispIdsToRemove[id];
                    return false;
                }
                return true;

            });

        // Update the dispId dict to remove the disps we just filtered out
        this.assignIdsToDisps();

        // For all the Disps that are not part of this branch, we need to add a DispNull
        // to make it's deletion
        let nullDispsToCreate = [];
        for (let dispId of Object.keys(dispIdsToRemove)) {
            let disp = dispIdsToRemove[dispId];
            if (disp.bounds == null) {
                throw new Error("Can not delete a disp with no bounds");
            }

            let nullDisp = {
                // Type
                '_tt': DispBase.TYPE_DU,

                // Level
                'le': disp.le,
                'lel': disp.lel,

                // Layer
                'la': disp.la,
                'lal': disp.lal,
            };

            DispNull.setGeomFromBounds(nullDisp, disp.bounds);
            DispBase.setReplacesHashId(nullDisp, DispBase.hashId(disp));
            nullDispsToCreate.push(nullDisp);
        }

        if (nullDispsToCreate.length != 0)
            this.addNewDisps(nullDispsToCreate);
        else
            this.touchUpdateDate();
    }


    get disps(): any[] {
        return this._array(BranchTuple.__DISPS_NUM).slice();
    }

    addAnchorDispKey(key: string): void {
        let anchors = this._array(BranchTuple.__ANCHOR_DISP_KEYS_NUM);
        if (anchors.filter(k => k == key).length != 0)
            return;

        this.touchUpdateDate(false);
        anchors.push(key);
    }

    get anchorDispKeys(): string[] {
        return this._array(BranchTuple.__ANCHOR_DISP_KEYS_NUM).slice();
    }


    touchUpdateDate(modelUpdateRequired: boolean = false): void {
        this.setUpdatedDate(new Date());
        if (this._contextUpdateCallback != null)
            this._contextUpdateCallback(modelUpdateRequired);
    }

    set visible(value: boolean) {
        this.packedJson__[BranchTuple.__VISIBLE_NUM] = value;
    }

    get visible(): boolean {
        return this.packedJson__[BranchTuple.__VISIBLE_NUM];
    }

    get updatedDate(): Date | null {
        let packedDate = this.packedJson__[BranchTuple.__UPDATED_DATE];
        if (packedDate == null)
            return packedDate;

        return serUril.fromStr(packedDate, SerialiseUtil.T_DATETIME);
    }

    private setUpdatedDate(value: Date | null): void {
        if (value == null)
            this.packedJson__[BranchTuple.__UPDATED_DATE] = null;
        else
            this.packedJson__[BranchTuple.__UPDATED_DATE] = serUril.toStr(value);
    }

    get createdDate(): Date {
        return serUril.fromStr(this.packedJson__[BranchTuple.__CREATED_DATE],
            SerialiseUtil.T_DATETIME);
    }

    private setCreatedDate(value: Date): void {
        this.packedJson__[BranchTuple.__CREATED_DATE] = serUril.toStr(value);
    }

    toJsonField(value: any,
                jsonDict: {} | null = null,
                name: string | null = null): any {
        if (name != "packedJson__")
            return Tuple.prototype.toJsonField(value, jsonDict, name);

        let convertedValue = deepCopy(value);

        let disps = convertedValue[BranchTuple.__DISPS_NUM];

        for (let disp of disps) {
            for (let key of Object.keys(disp)) {
                let dispval = disp[key];

                // Nulls are not included
                if (dispval == null)
                    delete disp[key];

                // Delete all the linked lookups, we just want the IDs
                else if (dispval['__rst'] != null) // VortexJS Serialise Class Type
                    delete disp[key];

                // Delete Bounds this is UI only
                else if (key == 'bounds')
                    delete disp[key];

                // // Reset temp ID
                // else if (key == "id" && dispval != null && dispval.indexOf("NEW_") == 0)
                //     delete disp[key];

            }
        }

        /* Now assign the value and it's value type if applicable */
        if (name != null && jsonDict != null)
            jsonDict[name] = convertedValue;

        return convertedValue;
    }

    linkDisps(lookupService: DiagramLookupService) {
        for (let disp of this.disps) {
            lookupService._linkDispLookups(disp);
        }
    }

    setContextUpdateCallback(contextUpdateCallback: ((modelUpdateRequired: boolean) => void) | null) {
        this._contextUpdateCallback = contextUpdateCallback;

    }

    applyLiveUpdate(liveUpdateTuple: BranchTuple): boolean {
        if (this.updatedDate == null
            || !moment(this.updatedDate).isAfter(liveUpdateTuple.updatedDate)) {
            this.packedJson__ = liveUpdateTuple.packedJson__;
            this.assignIdsToDisps();
            return true;
        }
        return false;
    }
}