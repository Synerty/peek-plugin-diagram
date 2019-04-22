import {DiagramLookupService} from "../DiagramLookupService";

export let BRANCH_DELTA_CLASSES_BY_TYPE = {};


export function addBranchDeltaType(deltaType: number) {
    return function (Cls) {
        if (BRANCH_DELTA_CLASSES_BY_TYPE[deltaType] != null) {
            throw new Error(`Delta Type ${deltaType} is already registered`);
        }
        BRANCH_DELTA_CLASSES_BY_TYPE[deltaType] = Cls;

        return Cls;
    };
}


/** Branch Delta Base
 *
 * This is the base class of all diagram deltas.
 * This is the publicly exposed class.
 *
 */
export abstract class DiagramDeltaBase {
    static readonly TYPE_COLOUR_OVERRIDE = 1;
    static readonly TYPE_CREATE_DISP = 2;

    /** The type of this delta */
    public readonly type: number;
    /** The type of this delta */
    public static readonly deltaType: number = null;

    private static readonly __DELTA_TYPE_NUM = 0;

    _jsonData: any[] = [];

    protected constructor(type: number) {
        this.type = type;
    }

    abstract __linkDispLookups(lookupCache: DiagramLookupService): void;

    deltaType(): string[] {
        return this._jsonData[DiagramDeltaBase.__DELTA_TYPE_NUM];
    }

}


