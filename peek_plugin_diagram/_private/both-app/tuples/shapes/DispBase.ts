import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../../canvas/shape-props/PeekCanvasShapePropsContext";

export interface PointI {
    x: number;
    y: number;
}

/** This type defines the list of points for geometry **/
export type PointsT = number[];

export type Disp = any;

export abstract class DispBase {

    // Duplicated in DispFactory
    static TYPE_DT = 'DT';
    static TYPE_DPG = 'DPG';
    static TYPE_DPL = 'DPL';
    static TYPE_DE = 'DE';
    static TYPE_DG = 'DG';
    static TYPE_DGP = 'DGP';

    static id(disp: Disp): number {
        return disp.id;
    }

    static groupId(disp: Disp): number {
        return disp.gi;
    }

    static level(disp: Disp): DispLevel {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lel;
    }


    static setLevel(disp: Disp, val: DispLevel): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.lel = val;
        disp.le = val == null ? null : val.id;
    }

    static layer(disp: Disp): DispLayer {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lal;
    }

    static setLayer(disp: Disp, val: DispLayer): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
         disp.lal = val;
         disp.la = val == null ? null : val.id;
    }

    static isSelectable(disp: Disp): boolean {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.s;
    }

    static setSelectable(disp: Disp, val: boolean): void {
        disp.s = val;
    }

    static key(disp: Disp): string | null {
        return disp.k;
    }

    static setKey(disp: Disp, val: string | null): void {
        disp.k = val;
    }

    static keys(disps: any[]): string[] {
        let keys = [];
        for (let disp of disps) {
            if (DispBase.key(disp) != null)
                keys.push(DispBase.key(disp));
        }
        return keys;
    }

    static data(disp: Disp): {} {
        if (disp.d == null)
            return {};
        return JSON.parse(disp.d);
    }

    static setData(disp: Disp, val: {} | null): void {
        if (val == null)
            disp.d = null;
        else
            disp.d = JSON.stringify(val);
    }

    // ---------------
    // Delta move helpers

    static deltaMove(disp, dx: number, dy: number) {
        if (disp.g == null)
            return;

        for (let i = 0; i < disp.g.length; i += 2) {
            disp.g[i] = disp.g[i] + dx;
            disp.g[i + 1] = disp.g[i + 1] + dy;
        }
    }

    static deltaMoveHandle(disp, handleIndex: number, dx: number, dy: number) {
        if (disp.g == null)
            return;

        let pointIndex = handleIndex * 2;
        disp.g[pointIndex] = disp.g[pointIndex] + dx;
        disp.g[pointIndex + 1] = disp.g[pointIndex + 1] + dy;
    }

    // ---------------
    // Create Method

    static create(type): any {
        let newDisp = {
            '_tt': type,
        };

        DispBase.setLevel(newDisp, null);
        DispBase.setLevel(newDisp, null);
        DispBase.setSelectable(newDisp, true);
        DispBase.setKey(newDisp, null);
        DispBase.setData(newDisp, null);

        return newDisp;
    }

    // ---------------
    // Populate shape edit context

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {

        context.addProp(new ShapeProp(
            ShapePropType.Layer,
            DispBase.layer,
            DispBase.setLayer,
            "Layer"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Level,
            DispBase.level,
            DispBase.setLevel,
            "Level"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.String,
            DispBase.key,
            DispBase.setKey,
            "Key"
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Boolean,
            DispBase.isSelectable,
            DispBase.setSelectable,
            "Selectable"
        ));

    }
}