import { DispBase, DispBaseT, PointI, PointsT } from "./DispBase";
import { PeekCanvasShapePropsContext } from "../canvas/PeekCanvasShapePropsContext";
import { ModelCoordSet } from "@peek/peek_plugin_diagram/_private/tuples";
import { PeekCanvasBounds } from "../canvas/PeekCanvasBounds";

export interface DispNullT extends DispBaseT {}

export class DispNull extends DispBase {
    static geom(disp): PointsT {
        return disp.g;
    }

    static centerPointX(disp: DispNullT): number {
        return disp.g[0];
    }

    static centerPointY(disp: DispNullT): number {
        return disp.g[1];
    }

    static center(disp: DispNullT): PointI {
        return { x: disp.g[0], y: disp.g[1] };
    }

    static setGeomFromBounds(disp: DispNullT, bounds: PeekCanvasBounds): void {
        disp.g = [
            bounds.x,
            bounds.y, // Bottom Left
            bounds.x + bounds.w,
            bounds.y, // Bottom Right
            bounds.x + bounds.w,
            bounds.y + bounds.h, // Top Right
            bounds.x,
            bounds.y + bounds.h, // Top Left
        ];
    }

    static create(coordSet: ModelCoordSet): DispNullT {
        return <DispNullT>DispBase.create(coordSet, DispBase.TYPE_DN);
    }

    static createFromShape(disp: DispBaseT, replacesHashId: string): DispNullT {
        if (disp.bounds == null)
            throw new Error("Can not delete a disp with no bounds");

        const nullDisp = <DispNullT>{
            // Type
            _tt: DispBase.TYPE_DN,

            // Level
            le: disp.le,
            lel: disp.lel,

            // Layer
            la: disp.la,
            lal: disp.lal,
        };
        DispBase.setReplacesHashId(nullDisp, replacesHashId);

        // This works if there is a bounds
        if (disp.bounds.width || disp.bounds.height) {
            DispNull.setGeomFromBounds(nullDisp, disp.bounds);
        } else {
            // Make sure updateBounds is called for each shape before replacing them"
            // Otherwise they will be filtered out of the grids by the
            // DispCompiler
            console.log(
                "ERROR: Failed to create DispNull geom," +
                    " DEVELOPER: Make sure updateBounds is called for each shape before" +
                    " replacing them"
            );
        }

        return nullDisp;
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispBase.makeShapeContext(context);
    }

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispNullT): string {
        let center = DispNull.center(disp);
        return (
            DispBase.makeShapeStr(disp) +
            `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`
        );
    }
}
