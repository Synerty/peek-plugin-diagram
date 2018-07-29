import {DispLevel} from "@peek/peek_plugin_diagram/_private/tuples/lookups";
import {DispLayer} from "@peek/peek_plugin_diagram/_private/tuples/lookups";

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

    static level(disp): DispLevel {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.lel;
    }

    static layer(disp): DispLayer {
        // This is set from the short id in LookupCache.linkDispLookups
        return disp.lal;
    }

    static isSelectable(disp): boolean {
        // This is set from the short id in LookupCache.linkDispLookups
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