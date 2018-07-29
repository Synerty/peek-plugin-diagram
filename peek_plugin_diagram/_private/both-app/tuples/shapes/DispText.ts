import {DispBase, PointI} from "./DispBase";
import {DispTextStyle} from "@peek/peek_plugin_diagram/_private/tuples/lookups";
import {DispColor} from "@peek/peek_plugin_diagram/_private/tuples/lookups";

export enum TextVerticalAlign {
    top = -1,
    center = 0,
    bottom = 1
}


export enum TextHorizontalAlign {
    left = -1,
    center = 0,
    right = 1
}

export class DispText extends DispBase {

    static textStyle(disp): DispTextStyle {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.fsl;
    }

    static color(disp): DispColor {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.cl;
    }

    static verticalAlign(disp): TextVerticalAlign {
        let val = disp.va;
        if (val == TextVerticalAlign.top)
            return TextVerticalAlign.top;
        if (val == TextVerticalAlign.bottom)
            return TextVerticalAlign.bottom;
        return TextVerticalAlign.center;
    }

    static horizontalAlign(disp): TextHorizontalAlign {
        let val = disp.ha;
        if (val == TextHorizontalAlign.left)
            return TextHorizontalAlign.left;
        if (val == TextHorizontalAlign.right)
            return TextHorizontalAlign.right;
        return TextHorizontalAlign.center;
    }

    static rotation(disp): number {
        return disp.r;
    }

    static text(disp): string {
        return disp.te;
    }

    static height(disp): number | null {
        return disp.th;
    }

    static horizontalStretch(disp): number {
        return disp.hs;
    }

    static centerPointX(disp): number {
        return disp.g[0];
    }

    static centerPointY(disp): number {
        return disp.g[1];
    }

}