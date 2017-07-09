import {DispBase, PointsT} from "./DispBase";
import {DispColor} from "../lookups/DispColor";
import {DispLineStyle} from "../lookups/DispLineStyle";

export class DispPolyline extends DispBase {

    static lineColor(disp): DispColor {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.lcl;
    }

    static lineStyle(disp): DispLineStyle {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.lsl;
    }

    static lineWidth(disp): number {
        return disp.w;
    }

    static geom(disp): PointsT {
        return disp.g;
    }

}