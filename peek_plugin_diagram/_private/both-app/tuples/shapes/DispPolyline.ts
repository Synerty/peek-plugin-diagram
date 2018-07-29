import {DispBase, PointsT} from "./DispBase";
import {DispColor} from "@peek/peek_plugin_diagram/_private/tuples/lookups";
import {DispLineStyle} from "@peek/peek_plugin_diagram/_private/tuples/lookups";

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

    /** Start Key
     *
     * The key of another disp object if the start of this polyline is related to it
     */
    static startKey(disp): string | null {
        return disp.sk;
    }

    /** End Key
     *
     * The key of another disp object if the end of this polyline is related to it
     */
    static endKey(disp): string | null {
        return disp.ek;
    }

}