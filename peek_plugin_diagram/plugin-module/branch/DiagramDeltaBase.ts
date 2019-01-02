export let BRANCH_DELTA_CLASSES_BY_TYPE = {};


export function addBranchDeltaType(deltaType: number) {
    return function (Cls) {
        if (BRANCH_DELTA_CLASSES_BY_TYPE[deltaType] == undefined) {
            throw new Error(`Delta Type ${deltaType} is already registered`);
        }

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

    /** The type of this delta */
    public readonly type: number;
    /** The type of this delta */
    public static readonly deltaType: number = null;

    _jsonData: any[] = [];

    protected constructor(type: number) {
        this.type = type;
    }

    static unpackJson(key: string, packedJson: string): DiagramBranchTuple {
        // Create the new object
        let newSelf = new DiagramBranchTuple();


        newSelf.modelSetKey = objectProps["modelSetKey"];
        newSelf.coordSetKey = objectProps["coordSetKey"];
        newSelf.key = key;

        // Unpack the custom data here
        newSelf.deltas = objectProps["deltas"];
        newSelf.visible = objectProps["visible"];

        return newSelf;

    }

    packJson(): string {
        // Reconstruct the data
        let jsonData: any[] = [
            this.type,
        ];

        return JSON.stringify(jsonData);

    }

}