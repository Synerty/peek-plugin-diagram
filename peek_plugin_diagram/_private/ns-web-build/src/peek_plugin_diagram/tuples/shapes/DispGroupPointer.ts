import {DispBase} from "./DispBase";

export class DispGroupPointer extends DispBase {


    static targetGroupId(disp): number {
        return disp.tg;
    }

    static verticalScale(disp): number {
        return disp.vs;
    }

    static horizontalScale(disp): number {
        return disp.hs;
    }
}