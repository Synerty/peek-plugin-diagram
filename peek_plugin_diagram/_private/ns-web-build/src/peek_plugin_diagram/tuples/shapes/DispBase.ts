import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";

export interface PointI {
    x: number;
    y: number;
}

/** This type defines the list of points for geometry **/
export type PointsT = number[];

export abstract class DispBase {

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

    static data(disp): {} {
        if (disp.d == null)
            return {};
        return JSON.parse(disp.d);
    }
}