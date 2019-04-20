import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";

export interface PointI {
    x: number;
    y: number;
}

/** This type defines the list of points for geometry **/
export type PointsT = number[];

export abstract class DispBase {

    static TYPE_DT = 'DT';
    static TYPE_DPG = 'DPG';
    static TYPE_DPL = 'DPL';
    static TYPE_DE = 'DE';
    static TYPE_DG = 'DG';
    static TYPE_DGP = 'DGP';

    static id(disp): number {
        return disp.id;
    }

    static groupId(disp): number {
        return disp.gi;
    }

    static level(disp): DispLevel {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lel;
    }

    static layer(disp): DispLayer {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lal;
    }

    static isSelectable(disp): boolean {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.s;
    }

    static key(disp): string | null {
        return disp.k;
    }

    static keys(disps: any[]): string[] {
        let keys = [];
        for (let disp of disps) {
            if (DispBase.key(disp) != null)
                keys.push(DispBase.key(disp));
        }
        return keys;
    }

    static data(disp): {} {
        if (disp.d == null)
            return {};
        return JSON.parse(disp.d);
    }

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
}