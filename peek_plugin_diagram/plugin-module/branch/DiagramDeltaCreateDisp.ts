import {addBranchDeltaType, DiagramDeltaBase} from "./DiagramDeltaBase";
import {DeltaCreateDisp} from "../_private/branch/deltas/DeltaCreateDisp";
import {DiagramLookupService} from "../DiagramLookupService";

/** Diagram Delta Create Disps Tuple
 *
 * This delta applies an override colour to a set of display keys.
 * This is the publicly exposed class.
 *
 */
@addBranchDeltaType(DiagramDeltaBase.TYPE_CREATE_DISP)
export class DiagramDeltaCreateDisp extends DiagramDeltaBase {

    constructor() {
        super(DiagramDeltaBase.TYPE_CREATE_DISP);
    }

    /** Link
     *
     * A PRIVATE method that populates the lookup classes, for easy use by other plugins.
     *
     * @param lookupService
     * @private
     */
    __linkDispLookups(lookupService: DiagramLookupService): void {
        for (let disp of this.disps) {
            if (lookupService._linkDispLookups(disp) == null) {
                console.log(`Failed to link the following disp`);
                console.log(disp);
            }
        }
    }

    /** The list of Disps to create */
    get disps(): string[] {
        return DeltaCreateDisp.disps(this._jsonData);
    }

    addDisp(disp: any): void {
        DeltaCreateDisp.addDisp(this._jsonData, disp);
    }



}
