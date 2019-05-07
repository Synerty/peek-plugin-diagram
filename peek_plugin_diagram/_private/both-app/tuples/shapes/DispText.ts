import {Disp, DispBase, DispBaseT} from "./DispBase";
import {DispColor, DispTextStyle} from "@peek/peek_plugin_diagram/lookups";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../../canvas/PeekCanvasShapePropsContext";

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

export interface DispTextT extends DispBaseT {

    // Text Style
    fs: number;
    fsl: DispTextStyle;

    // Colour
    c: number;
    cl: DispColor;

    // Vertical Alignment
    va: number;

    // Horizontal Alignment
    ha: number;

    // Rotation
    r: number;

    // Text
    te: string;

    // Text Height (Optional)
    th: number | null;

    // Horizontal Stretch (default 1)
    hs: number;

}

export class DispText extends DispBase {

    static textStyle(disp: DispTextT): DispTextStyle {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.fsl;
    }

    static setTextStyle(disp: DispTextT, val: DispTextStyle): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.fsl = val;
        disp.fs = val == null ? null : val.id;
    }

    static color(disp: DispTextT): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.cl;
    }

    static setColor(disp: DispTextT, val: DispColor): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.cl = val;
        disp.c = val == null ? null : val.id;
    }

    static verticalAlign(disp: DispTextT): TextVerticalAlign {
        let val = disp.va;
        if (val == TextVerticalAlign.top)
            return TextVerticalAlign.top;
        if (val == TextVerticalAlign.bottom)
            return TextVerticalAlign.bottom;
        return TextVerticalAlign.center;
    }

    static horizontalAlign(disp: DispTextT): TextHorizontalAlign {
        let val = disp.ha;
        if (val == TextHorizontalAlign.left)
            return TextHorizontalAlign.left;
        if (val == TextHorizontalAlign.right)
            return TextHorizontalAlign.right;
        return TextHorizontalAlign.center;
    }

    static rotation(disp: DispTextT): number {
        return disp.r;
    }

    static text(disp: DispTextT): string {
        return disp.te;
    }

    static setText(disp: DispTextT, val: string): void {
        disp.te = val;
    }

    static height(disp: DispTextT): number | null {
        return disp.th;
    }

    static horizontalStretch(disp: DispTextT): number {
        return disp.hs;
    }

    static centerPointX(disp: DispTextT): number {
        return disp.g[0];
    }

    static centerPointY(disp: DispTextT): number {
        return disp.g[1];
    }

    static setCenterPoint(disp:DispTextT, x: number, y: number): void {
        if (disp.g == null || disp.g.length != 2)
            disp.g = [0, 0];

        disp.g[0] = x;
        disp.g[1] = y;
    }

    static create(): DispTextT {
        let newDisp = {
            ...DispBase.create(DispBase.TYPE_DT),
            // From Text
            'va': TextVerticalAlign.center, // TextVerticalAlign.center
            'ha': TextHorizontalAlign.center, // TextHorizontalAlign.center
            'r': 0, // number
            'te': 'New Text', // string
            'th': null, // number | null
            'hs': 1, // number | null
        };

        let dispTextStyle = new DispTextStyle();
        dispTextStyle.id = 30;

        let dispColor = new DispColor();
        dispColor.id = 7;

        DispText.setTextStyle(newDisp, dispTextStyle);
        DispText.setColor(newDisp, dispColor);

        DispText.setText(newDisp, 'New Text');
        DispText.setCenterPoint(newDisp, 0, 0);

        return newDisp;
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispBase.makeShapeContext(context);

        context.addProp(new ShapeProp(
            ShapePropType.MultilineString,
            DispText.text,
            DispText.setText,
            "Text"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.TextStyle,
            DispText.textStyle,
            DispText.setTextStyle,
            "Text Style"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Color,
            DispText.color,
            DispText.setColor,
            "Color"
        ));
    }

}