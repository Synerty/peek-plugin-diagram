import {DispBase, PointI} from "./DispBase";
import {DispColor} from "@peek/peek_plugin_diagram/lookups";
import {DispLineStyle} from "@peek/peek_plugin_diagram/lookups";

export class DispEllipse extends DispBase {

    static fillColor(disp): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.fcl;
    }

    static lineColor(disp): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lcl;
    }

    static lineStyle(disp): DispLineStyle {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lsl;
    }

    static lineWidth(disp): number {
        return disp.w;
    }

    static centerPointX(disp): number {
        return disp.g[0];
    }

    static centerPointY(disp): number {
        return disp.g[1];
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

    static center(disp): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }


}