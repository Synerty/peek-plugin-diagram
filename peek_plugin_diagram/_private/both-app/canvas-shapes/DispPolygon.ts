import {DispColor} from "@peek/peek_plugin_diagram/lookups";
import {DispPoly, DispPolyT} from "./DispPoly";
import {DispBase, PointI} from "./DispBase";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../canvas/PeekCanvasShapePropsContext";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples/ModelCoordSet";

export enum PolygonFillDirection {
    fillTopToBottom = 0,
    fillBottomToTop = 1,
    fillRightToLeft = 2,
    fillLeftToRight = 3
}


export interface DispPolygonT extends DispPolyT {

    // fillColor
    fc: number;
    fcl: DispColor;

    // cornerRadius
    cr: number;

    // fillDirection
    fd: number;

    // fillPercent
    fp: number;

    // Is this polygon a rectangle
    r: boolean | null;

}

export class DispPolygon extends DispPoly {

    static fillColor(disp: DispPolygonT): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.fcl;
    }

    static setFillColor(disp: DispPolygonT, val: DispColor): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.fcl = val;
        disp.fc = val == null ? null : val.id;
    }


    static cornerRadius(disp: DispPolygonT): number {
        return disp.cr;
    }

    static setCornerRadius(disp: DispPolygonT, val: number): void {
        disp.cr = val;
    }

    static fillDirection(disp: DispPolygonT): PolygonFillDirection {
        let val = disp.fd;
        if (val == PolygonFillDirection.fillBottomToTop)
            return PolygonFillDirection.fillBottomToTop;

        if (val == PolygonFillDirection.fillRightToLeft)
            return PolygonFillDirection.fillRightToLeft;

        if (val == PolygonFillDirection.fillLeftToRight)
            return PolygonFillDirection.fillLeftToRight;

        return PolygonFillDirection.fillTopToBottom;
    }

    static setFillDirection(disp: DispPolygonT, val: number): void {
        disp.fd = val;
    }

    static fillPercent(disp: DispPolygonT): number {
        return disp.fp;
    }

    static setFillPercent(disp: DispPolygonT, val: number): void {
        disp.fp = val;
    }

    static isRectangle(disp: DispPolygonT): boolean {
        return !!disp.r;
    }

    static setIsRectangle(disp: DispPolygonT, val: boolean): void {
        disp.r = !val ? null : true;
    }

    static center(disp: DispPolygonT): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static create(coordSet: ModelCoordSet): DispPolygonT {
        let disp = <DispPolygonT>DispPoly.create(coordSet, DispBase.TYPE_DPG);
        DispPolygon.setCornerRadius(disp, 0);
        DispPolygon.setFillDirection(disp, PolygonFillDirection.fillTopToBottom);
        DispPolygon.setFillPercent(disp, 100);
        return disp;

    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispPoly.makeShapeContext(context);

        context.addProp(new ShapeProp(
            ShapePropType.Color,
            DispPolygon.fillColor,
            DispPolygon.setFillColor,
            "Fill Color"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Option,
            (disp) => { // The UI expects an object with an ID
                return {id: DispPolygon.fillDirection(disp)}
            },
            (disp, valObj) => DispPolygon.setFillDirection(disp, valObj.id),
            "Fill Direction",
            {
                options: [
                    {
                        name: "Bottom to Top",
                        object: {id: PolygonFillDirection.fillBottomToTop},
                        value: PolygonFillDirection.fillBottomToTop,
                    },
                    {
                        name: "Right to Left",
                        object: {id: PolygonFillDirection.fillRightToLeft},
                        value: PolygonFillDirection.fillRightToLeft,
                    },
                    {
                        name: "Left to Right",
                        object: {id: PolygonFillDirection.fillLeftToRight},
                        value: PolygonFillDirection.fillLeftToRight,
                    },
                    {
                        name: "Top to Bottom",
                        object: {id: PolygonFillDirection.fillTopToBottom},
                        value: PolygonFillDirection.fillTopToBottom,
                    }
                ]
            }
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Integer,
            DispPolygon.fillPercent,
            DispPolygon.setFillPercent,
            "Fill Percent"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Integer,
            DispPolygon.cornerRadius,
            DispPolygon.setCornerRadius,
            "Corner Radius"
        ));

    }

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispPolygonT): string {
        let center = DispPolygon.center(disp);
        return DispBase.makeShapeStr(disp)
            + `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`;
    }

}