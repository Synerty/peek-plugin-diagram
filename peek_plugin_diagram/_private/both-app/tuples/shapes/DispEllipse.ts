import {DispBase, PointI} from "./DispBase";
import {DispColor} from "../lookups/DispColor";
import {DispLineStyle} from "../lookups/DispLineStyle";

export class DispEllipse extends DispBase {

    static fillColor(disp): DispColor {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.fcl;
    }

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

    static centerPoint(disp): PointI {
        return disp.g[0];
    }

    static xRadius(disp): number {
        return disp.xr;
    }

    static yRadius(disp): number {
        return disp.yr;
    }

    static rotation(disp): number {
        return disp.r;
    }

    static startAngle(disp): number {
        return disp.sa;
    }

    static endAngle(disp): number {
        return disp.ea;
    }


}