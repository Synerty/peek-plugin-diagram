import {Disp, DispBase} from "./DispBase";
import {DispColor, DispTextStyle} from "@peek/peek_plugin_diagram/lookups";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../../canvas/shape-props/PeekCanvasShapePropsContext";

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

    static textStyle(disp: Disp): DispTextStyle {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.fsl;
    }

    static setTextStyle(disp: Disp, val: DispTextStyle): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.fsl = val;
        disp.fs = val == null ? null : val.id;
    }

    static color(disp: Disp): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.cl;
    }

    static setColor(disp: Disp, val: DispColor): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.cl = val;
        disp.c = val == null ? null : val.id;
    }

    static verticalAlign(disp: Disp): TextVerticalAlign {
        let val = disp.va;
        if (val == TextVerticalAlign.top)
            return TextVerticalAlign.top;
        if (val == TextVerticalAlign.bottom)
            return TextVerticalAlign.bottom;
        return TextVerticalAlign.center;
    }

    static horizontalAlign(disp: Disp): TextHorizontalAlign {
        let val = disp.ha;
        if (val == TextHorizontalAlign.left)
            return TextHorizontalAlign.left;
        if (val == TextHorizontalAlign.right)
            return TextHorizontalAlign.right;
        return TextHorizontalAlign.center;
    }

    static rotation(disp: Disp): number {
        return disp.r;
    }

    static text(disp: Disp): string {
        return disp.te;
    }

    static setText(disp: Disp, val: string): void {
        disp.te = val;
    }

    static height(disp: Disp): number | null {
        return disp.th;
    }

    static horizontalStretch(disp: Disp): number {
        return disp.hs;
    }

    static centerPointX(disp: Disp): number {
        return disp.g[0];
    }

    static centerPointY(disp: Disp): number {
        return disp.g[1];
    }

    static setCenterPoint(disp, x: number, y: number): void {
        if (disp.g == null || disp.g.length != 2)
            disp.g = [0, 0];

        disp.g[0] = x;
        disp.g[1] = y;
    }

    static create(): any {
        let newDisp = {
            ...DispBase.create(DispBase.TYPE_DT),
            // From Text
            'fsl': null, // DispTextStyle
            'cl': null, // DispColor
            'va': TextVerticalAlign.center, // TextVerticalAlign.center
            'ha': TextHorizontalAlign.center, // TextHorizontalAlign.center
            'r': 0, // number
            'te': 'New Text', // string
            'th': 0, // number | null
            'hs': 0, // number | null
        };

        DispText.setText(newDisp, 'New Text');
        DispText.setCenterPoint(newDisp, 0, 0);

        return newDisp;
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispBase.makeShapeContext(context);

        context.addProp(new ShapeProp(
            ShapePropType.String,
            DispText.text,
            DispText.setText,
            "Text"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Color,
            DispText.color,
            DispText.setColor,
            "Color"
        ));
    }

}