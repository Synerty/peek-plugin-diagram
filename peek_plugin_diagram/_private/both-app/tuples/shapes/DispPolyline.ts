import {DispPoly, DispPolyT} from "./DispPoly";
import {DispBase, PointI} from "./DispBase";
import {PeekCanvasShapePropsContext} from "../../canvas/PeekCanvasShapePropsContext";
import {DispTextT} from "./DispText";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples/ModelCoordSet";


export interface DispPolylineT extends DispPolyT {

    // Start Key
    sk: string;

    // End Key
    ek: string;

}

export class DispPolyline extends DispPoly {


    /** Start Key
     *
     * The key of another disp object if the start of this polyline is related to it
     */
    static startKey(disp: DispPolylineT): string | null {
        return disp.sk;
    }

    /** End Key
     *
     * The key of another disp object if the end of this polyline is related to it
     */
    static endKey(disp: DispPolylineT): string | null {
        return disp.ek;
    }

    static deltaMoveStart(disp: any, dx: number, dy: number) {
        disp.g[0] += dx;
        disp.g[1] += dy;

    }

    static deltaMoveEnd(disp: any, dx: number, dy: number) {
        let len = disp.g.length;
        disp.g[len - 2] += dx;
        disp.g[len - 1] += dy;
    }

    static center(disp): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static create(coordSet: ModelCoordSet): DispPolylineT {
        return <DispPolylineT> DispPoly.create(coordSet, DispBase.TYPE_DPL);
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispPoly.makeShapeContext(context);

    }

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispTextT): string {
        let center = DispPolyline.center(disp);
        return DispBase.makeShapeStr(disp)
            + `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`;
    }
}
