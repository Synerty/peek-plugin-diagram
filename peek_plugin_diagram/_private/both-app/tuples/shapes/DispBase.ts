import {DispLevel} from "../lookups/DispLevel";
import {DispLayer} from "../lookups/DispLayer";

export interface PointI {
    x: number;
    y: number;
}

/** This type defines the list of points for geometry **/
export type PointsT = PointI[];

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
}