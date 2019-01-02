import {addBranchDeltaType, DiagramDeltaBase} from "./DiagramDeltaBase";
import {DispColor} from "../_private/tuples/lookups";
import {DeltaColorOverride} from "../../_private/both-app/tuples/deltas/DeltaColorOverride";

/** Diagram Delta Color Override Tuple
 *
 * This delta applies an override colour to a set of display keys.
 * This is the publicly exposed class.
 *
 */
@addBranchDeltaType(DiagramDeltaBase.TYPE_COLOUR_OVERRIDE)
export class DiagramDeltaColorOverride extends DiagramDeltaBase {


    constructor() {
        super(DiagramDeltaBase.TYPE_COLOUR_OVERRIDE);
    }

    /** The Disp Keys to color */
    get dispKeys(): string[] {
        return DeltaColorOverride.dispKeys(this._jsonData);
    }

    addDispKeys(dispKeys: string[]): void {
        DeltaColorOverride.addDispKeys(this._jsonData, dispKeys);
    }

    /** The Line Color apples to shape lines */
    get lineColor(): DispColor | null {
        let colorInt = DeltaColorOverride.lineColor(this._jsonData);

    }

    /** The Fill Color applies to closed shapes */
    get fillColor(): DispColor | null {

    }

    /** This color applies to texts */
    get color(): DispColor | null {

    }


}
