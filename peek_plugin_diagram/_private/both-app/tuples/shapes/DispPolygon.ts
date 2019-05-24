import {DispBase, PointsT} from "./DispBase";
import {DispColor} from "@peek/peek_plugin_diagram/lookups";
import {DispLineStyle} from "@peek/peek_plugin_diagram/lookups";
import {PeekCanvasPoint} from "../../canvas/PeekCanvasBounds";
import {DispGroupPointerT} from "./DispGroupPointer";

export enum PolygonFillDirection {
    fillTopToBottom = 0,
    fillBottomToTop = 1,
    fillRightToLeft = 2,
    fillLeftToRight = 3
}

export class DispPolygon extends DispBase {

    static fillColor(disp): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.fcl;
    }

    static lineColor(disp): DispColor {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lcl;
    }

    static lineStyle(disp): DispLineStyle {
        // This is set from the short id in DiagramLookupService._linkDispLookups
        return disp.lsl;
    }

    static cornerRadius(disp): number {
        return disp.cr;
    }

    static lineWidth(disp): number {
        return disp.w;
    }

    static geom(disp): PointsT {
        return disp.g;
    }

    static fillDirection(disp): PolygonFillDirection {
        let val = disp.fd;
        if (val == PolygonFillDirection.fillBottomToTop)
            return PolygonFillDirection.fillBottomToTop;

        if (val == PolygonFillDirection.fillRightToLeft)
            return PolygonFillDirection.fillRightToLeft;

        if (val == PolygonFillDirection.fillLeftToRight)
            return PolygonFillDirection.fillLeftToRight;

        return PolygonFillDirection.fillTopToBottom;

    }

    static fillPercent(disp): number {
        return disp.fp;
    }

    static center(disp): PeekCanvasPoint {
        return {x: disp.g[0], y: disp.g[1]};
    }

}