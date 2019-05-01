import {DeltaBase} from "./DeltaBase";

/** Diagram Delta Create Disp
 *
 * Static Accessors
 *
 * This delta stores new disps created in a branch.
 *
 */
export class DeltaCreateDisp extends DeltaBase {

    private static readonly __DISP_NUM = 1;

    static disps(deltaJson): any[] {
        return deltaJson[DeltaCreateDisp.__DISP_NUM];
    }

    static addDisp(deltaJson: any[], disp: any): void {
        if (deltaJson[DeltaCreateDisp.__DISP_NUM] == null)
            deltaJson[DeltaCreateDisp.__DISP_NUM] = [];
        deltaJson[DeltaCreateDisp.__DISP_NUM].push(disp);
    }


}
