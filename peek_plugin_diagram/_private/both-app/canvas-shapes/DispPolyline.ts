import {DispPoly, DispPolyT} from "./DispPoly";
import {DispBase, DispType, PointI} from "./DispBase";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../canvas/PeekCanvasShapePropsContext";
import {DispTextT} from "./DispText";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples/ModelCoordSet";


export interface DispPolylineT extends DispPolyT {
    // Start Key
    sk: string;

    // End Key
    ek: string;

    // Start end type, is this an arrow, etc?
    st: number | null;

    // End End Type
    et: number | null;
}

export enum DispPolylineEndTypeE {
    None = 0,
    Arrow = 1,
    Dot = 2
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


    /** Start Key
     *
     * The key of another disp object if the start of this polyline is related to it
     */
    static startEndType(disp: DispPolylineT): DispPolylineEndTypeE {
        return disp.st || 0;
    }

    static setStartEndType(disp: DispPolylineT, val: number | null): void {
        disp.st = val == 0 ? null : val;
    }


    /** End Key
     *
     * The key of another disp object if the end of this polyline is related to it
     */
    static endEndType(disp: DispPolylineT): DispPolylineEndTypeE {
        return disp.et || 0;
    }

    static setEndEndType(disp: DispPolylineT, val: number | null): void {
        disp.et = val == 0 ? null : val;
    }

    /** Start End Keys
     *
     * This method returns a unique list af the start and end keys of the selected
     * polylines.
     *
     * Non-polylines are ignored.
     *
     * @param disps: A list of shapes
     * @return: A list of start and end keys
     */
    static startEndKeys(disps: any[]): string[] {
        let keysDict = {};
        for (let disp of disps) {
            if (DispBase.typeOf(disp) != DispType.polyline)
                continue;

            let startKey = DispPolyline.startKey(disp);
            let endKey = DispPolyline.endKey(disp);

            if (startKey != null)
                keysDict[startKey] = true;

            else if (endKey != null)
                keysDict[endKey] = true;
        }
        return Object.keys(keysDict);
    }

    static deltaMoveStart(disp: any, dx: number, dy: number) {
        disp.g[0] += dx;
        disp.g[1] += dy;
        disp.bounds = null;
    }

    static deltaMoveEnd(disp: any, dx: number, dy: number) {
        let len = disp.g.length;
        disp.g[len - 2] += dx;
        disp.g[len - 1] += dy;
        disp.bounds = null;
    }

    static center(disp): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static firstPoint(disp): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static lastPoint(disp): PointI {
        let l = disp.g.length;
        return {x: disp.g[l - 2], y: disp.g[l - 1]};
    }

    static create(coordSet: ModelCoordSet): DispPolylineT {
        return <DispPolylineT>DispPoly.create(coordSet, DispBase.TYPE_DPL);
    }


    // ---------------
    // Support shape editing
    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispPoly.makeShapeContext(context);

        let lineEndOptions = [
            {
                name: "None",
                object: {id: DispPolylineEndTypeE.None},
                value: DispPolylineEndTypeE.None,
            },
            {
                name: "Arrow",
                object: {id: DispPolylineEndTypeE.Arrow},
                value: DispPolylineEndTypeE.Arrow,
            },
            {
                name: "Dot",
                object: {id: DispPolylineEndTypeE.Dot},
                value: DispPolylineEndTypeE.Dot,
            }
        ];

        context.addProp(new ShapeProp(
            ShapePropType.Option,
            (disp) => { // The UI expects an object with an ID
                return {id: DispPolyline.startEndType(disp)}
            },
            (disp, valObj) => DispPolyline.setStartEndType(disp, valObj.id),
            "Line Start Style",
            {options: lineEndOptions}
        ));

        context.addProp(new ShapeProp(
            ShapePropType.Option,
            (disp) => { // The UI expects an object with an ID
                return {id: DispPolyline.endEndType(disp)}
            },
            (disp, valObj) => DispPolyline.setEndEndType(disp, valObj.id),
            "Line End Style",
            {options: lineEndOptions}
        ));

    }

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispTextT): string {
        let center = DispPolyline.center(disp);
        return DispBase.makeShapeStr(disp)
            + `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`;
    }


    // ---------------
    // Generate a list of handles to edit this shape

    static isStartHandle(disp, handleIndex: number): boolean {
        if (DispBase.typeOf(disp) != DispType.polyline)
            return false;

        return handleIndex == 0;
    }


    static isEndHandle(disp, handleIndex: number): boolean {
        if (DispBase.typeOf(disp) != DispType.polyline)
            return false;

        return handleIndex == DispPolyline.geom(disp).length / 2 - 1;
    }

    static handlePoints(disp, margin: number): PointI[] {
        let result = [];

        let points = DispPolyline.geom(disp);

        function addHandle(p, ref) {
            let adj = (p.x - ref.x);
            let opp = (p.y - ref.y);
            let hypot = Math.sqrt(Math.pow(adj, 2) + Math.pow(opp, 2));

            let multiplier = margin / hypot;

            result.push({x: p.x + adj * multiplier, y: p.y + opp * multiplier});
        }


        //function rotatePoint(point, theta) {
        //    // Rotates the given polygon which consists of corners represented as (x,y),
        //    // around the ORIGIN, clock-wise, theta degrees
        //    let simTheta = Math.sin(theta);
        //    let cosTheta = Math.cos(theta);
        //
        //    return {
        //        x: point.x * cosTheta - point.y * simTheta,
        //        y: point.y = point.x * simTheta + point.y * cosTheta
        //    };
        //}
        //
        // //
        // // Calculates the angle ABC (in radians)
        // //
        // // A first point
        // // C second point
        // // B center point
        // //
        //
        //function findAngle(A, B, C) {
        //    let AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
        //    let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        //    let AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
        //    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
        //}

        function pointForIndex(index: number) {
            index *= 2;
            return {x: points[index], y: points[index + 1]};
        }


        let firstXy = {x: points[0], y: points[1]};
        addHandle(pointForIndex(0), pointForIndex(1));

        let lastXy = firstXy;
        for (let i = 1; i < points.length / 2; ++i) {
            let thisXy = pointForIndex(i);
            let refXy = lastXy;
            if (i + 2 < points.length / 2) {
                let nextXy = pointForIndex(i + 1);

                //let angle = findAngle(lastXy, thisXy, nextXy);
                //refXy = rotatePoint({x:lastXy.x - this.left, y:lastXy.y - this.top}, angle / 2);

                refXy.x = (lastXy.x + nextXy.x) / 2;
                refXy.y = (lastXy.y + nextXy.y) / 2;
            }
            addHandle(thisXy, refXy);
        }

        return result;
    }


}
