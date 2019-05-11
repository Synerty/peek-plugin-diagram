import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../../canvas/PeekCanvasShapePropsContext";
import {PeekCanvasBounds} from "../../canvas/PeekCanvasBounds";

export interface PointI {
    x: number;
    y: number;
}

/** This type defines the list of points for geometry **/
export type PointsT = number[];

export interface DispBaseT {
    // The type of the disp
    _tt: string,

    // The ID of the disp
    id: number;

    // This is the unique hash of the contents of this disp within this coordSetId.
    hid: string;

    // Key
    k: string | null;

    // Group ID
    gi: number | null;

    // Branch ID
    bi: number | null;

    // Branch Stage
    bs: number | null;

    // Replaces DispID
    rid: string | null;

    // Level
    le: number;
    lel: DispLevel;

    // Layer
    la: number;
    lal: DispLayer;

    // Is Selectable
    s: boolean;

    // Data (stringified JSON)
    d: string | null;

    // Geomoetry
    g: number[];

    // bounds, this is assigned during the rendering process
    bounds: PeekCanvasBounds | null;

}

export abstract class DispBase {

    // Duplicated in DispFactory
    static TYPE_DT = 'DT';
    static TYPE_DPG = 'DPG';
    static TYPE_DPL = 'DPL';
    static TYPE_DE = 'DE';
    static TYPE_DG = 'DG';
    static TYPE_DGP = 'DGP';


    static setId(disp: DispBaseT, value: number): void {
        disp.id = value;
    }

    static id(disp: DispBaseT): number {
        return disp.id;
    }

    static groupId(disp: DispBaseT): number {
        return disp.gi;
    }


    static branchId(disp: DispBaseT): number {
        return disp.bi;
    }

    static setBranchStage(disp: DispBaseT, value: number): void {
        disp.bs = value;
    }


    static branchStage(disp: DispBaseT): number {
        return disp.bs;
    }

    static level(disp: DispBaseT): DispLevel {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lel;
    }


    static setLevel(disp: DispBaseT, val: DispLevel): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.lel = val;
        disp.le = val == null ? null : val.id;
    }

    static layer(disp: DispBaseT): DispLayer {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lal;
    }

    static setLayer(disp: DispBaseT, val: DispLayer): void {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        disp.lal = val;
        disp.la = val == null ? null : val.id;
    }

    static isSelectable(disp: DispBaseT): boolean {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.s;
    }

    static setSelectable(disp: DispBaseT, val: boolean): void {
        disp.s = val;
    }

    static key(disp: DispBaseT): string | null {
        return disp.k;
    }

    static setKey(disp: DispBaseT, val: string | null): void {
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

    static data(disp: DispBaseT): {} {
        if (disp.d == null)
            return {};
        return JSON.parse(disp.d);
    }

    static setData(disp: DispBaseT, val: {} | null): void {
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
        let newDisp: any = {
            '_tt': type,
        };
        let level = new DispLevel();
        level.id = 735;

        let layer = new DispLayer();
        layer.id = 1;

        DispBase.setLayer(newDisp, layer);
        DispBase.setLevel(newDisp, level);
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