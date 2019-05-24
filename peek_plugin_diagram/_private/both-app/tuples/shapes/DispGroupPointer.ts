import {DispBase, DispBaseT} from "./DispBase";
import {PeekCanvasPoint} from "../../canvas/PeekCanvasBounds";
import {PeekCanvasShapePropsContext} from "../../canvas/PeekCanvasShapePropsContext";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples";

export interface DispGroupPointerT extends DispBaseT {

    // targetGroupId
    tg: number;

    // verticalScale
    vs: number;

    // horizontalScale
    hs: number;

    // Disp Items
    di: any[];

}

export class DispGroupPointer extends DispBase {

    static items(disp: DispGroupPointerT): DispBaseT[] {
        return disp.di == null ? [] : disp.di;
    }

    static addDisp(disp: DispGroupPointerT, dispChild: DispBaseT): void {
        if (disp.di == null)
            disp.di = [];
        disp.di.push(dispChild);
    }

    static clearDisps(disp: DispGroupPointerT): void {
        disp.di = [];
    }

    static targetGroupId(disp: DispGroupPointerT): number {
        return disp.tg;
    }

    static verticalScale(disp: DispGroupPointerT): number {
        return disp.vs;
    }

    static horizontalScale(disp: DispGroupPointerT): number {
        return disp.hs;
    }

    static center(disp: DispGroupPointerT): PeekCanvasPoint {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static setCenterPoint(disp: DispGroupPointerT, x: number, y: number): void {
        disp.g = [x, y];
    }

    static create(coordSet: ModelCoordSet): DispGroupPointerT {
        let newDisp = {
            ...DispBase.create(DispBase.TYPE_DGP, coordSet),
            // From Text
            'tg': null, // TextVerticalAlign.targetGroupId
            'vs': 1.0, // TextHorizontalAlign.verticalScale
            'hs': 1.0,  // TextHorizontalAlign.horizontalScale
        };

        DispGroupPointer.setSelectable(newDisp, true);
        DispGroupPointer.setCenterPoint(newDisp, 0, 0);

        return newDisp;
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispBase.makeShapeContext(context);

        // context.addProp(new ShapeProp(
        //     ShapePropType.MultilineString,
        //     DispGroupPointer.text,
        //     DispGroupPointer.setText,
        //     "Text"
        // ));
        //
        // context.addProp(new ShapeProp(
        //     ShapePropType.TextStyle,
        //     DispGroupPointer.textStyle,
        //     DispGroupPointer.setTextStyle,
        //     "Text Style"
        // ));
        //
        // context.addProp(new ShapeProp(
        //     ShapePropType.Color,
        //     DispGroupPointer.color,
        //     DispGroupPointer.setColor,
        //     "Color"
        // ));
    }

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispGroupPointerT): string {
        let center = DispGroupPointer.center(disp);
        return DispBase.makeShapeStr(disp)
            // + `\nText : ${DispGroupPointer.targetGroupId(disp)}`
            + `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`;
    }
}