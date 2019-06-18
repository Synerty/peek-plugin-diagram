import {DispLayer, DispLevel} from "@peek/peek_plugin_diagram/lookups";
import {
    PeekCanvasShapePropsContext,
    ShapeProp,
    ShapePropType
} from "../canvas/PeekCanvasShapePropsContext";
import {PeekCanvasBounds} from "../canvas/PeekCanvasBounds";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples";
import {deepCopy} from "@synerty/vortexjs/src/vortex/UtilMisc";

export interface PointI {
    x: number;
    y: number;
}

export enum DispType {
    ellipse,
    polygon,
    polyline,
    text,
    group,
    groupPointer,
    null_
}

/** This type defines the list of points for geometry **/
export type PointsT = number[];

export interface DispBaseT {
    // The type of the disp
    _tt: string,

    // The ID of the disp
    id: number;

    // Z Order
    z: number;

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

    // Replaces Disp HashId
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
    static TYPE_DT = 'DT';
    static TYPE_DPG = 'DPG';
    static TYPE_DPL = 'DPL';
    static TYPE_DE = 'DE';
    static TYPE_DG = 'DG';
    static TYPE_DGP = 'DGP';
    static TYPE_DN = 'DN';

    private static _typeMapInit = false;
    private static _typeMap = {};

    // Lazy instantiation, because the string types are defined elsewhere
    private static get typeMap() {
        if (!DispBase._typeMapInit) {
            DispBase._typeMapInit = true;
            DispBase._typeMap[DispBase.TYPE_DT] = [DispType.text, 'Text'];
            DispBase._typeMap[DispBase.TYPE_DPG] = [DispType.polygon, 'Polygon'];
            DispBase._typeMap[DispBase.TYPE_DPL] = [DispType.polyline, 'Polyline'];
            DispBase._typeMap[DispBase.TYPE_DE] = [DispType.ellipse, 'Ellipse'];
            DispBase._typeMap[DispBase.TYPE_DG] = [DispType.group, 'Group'];
            DispBase._typeMap[DispBase.TYPE_DGP] = [DispType.groupPointer, 'GroupPointer'];
            DispBase._typeMap[DispBase.TYPE_DN] = [DispType.null_, 'Deleted Shape'];
        }

        return DispBase._typeMap;
    };

    // Helper query methods

    static typeOf(disp): DispType {
        return DispBase.typeMap[disp._tt][0];
    }

    static hasColor(disp: any) {
        return !!(disp.lcl || disp.fcl || disp.cl);
    }

    static niceName(disp): string {
        return DispBase.typeMap[disp._tt][1];
    }

    // Getters and setters

    static type(disp: DispBaseT): string {
        return disp._tt;
    }

    static id(disp: DispBaseT): number {
        return disp.id;
    }

    static setId(disp: DispBaseT, value: number): void {
        disp.id = value;
    }

    static zOrder(disp: DispBaseT): number {
        return disp.z || 0; // defaults to 0
    }

    static setZOrder(disp: DispBaseT, value: number): void {
        disp.z = value;
    }

    static hashId(disp: DispBaseT): string {
        return disp.hid;
    }

    static setHashId(disp: DispBaseT, value: string): void {
        disp.hid = value;
    }

    static replacesHashId(disp: DispBaseT): string {
        return disp.rid;
    }

    static setReplacesHashId(disp: DispBaseT, value: string): void {
        disp.rid = value;
    }

    static groupId(disp: DispBaseT): number {
        return disp.gi;
    }

    static setGroupId(disp: DispBaseT, val: number): void {
        disp.gi = val;
    }

    static branchId(disp: DispBaseT): number {
        return disp.bi;
    }

    static branchStage(disp: DispBaseT): number {
        return disp.bs;
    }

    static setBranchStage(disp: DispBaseT, value: number): void {
        disp.bs = value;
    }

    static level(disp: DispBaseT): DispLevel {
        // This is set from the short id in PrivateDiagramLookupService._linkDispLookups
        return disp.lel;
    }

    static setLevel(disp: DispBaseT, val: DispLevel): void {
        // This is set from the short id in PrivateDiagramLookupService._linkDispLookups
        disp.lel = val;
        disp.le = val == null ? null : val.id;
    }

    static layer(disp: DispBaseT): DispLayer {
        // This is set from the short id in PrivateDiagramLookupService._linkDispLookups
        return disp.lal;
    }

    static setLayer(disp: DispBaseT, val: DispLayer): void {
        // This is set from the short id in PrivateDiagramLookupService._linkDispLookups
        disp.lal = val;
        disp.la = val == null ? null : val.id;
    }

    static isSelectable(disp: DispBaseT): boolean {
        // This is set from the short id in PrivateDiagramLookupService._linkDispLookups
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
        disp.bounds = null;
    }

    static deltaMoveHandle(disp, handleIndex: number, dx: number, dy: number) {
        if (disp.g == null)
            return;

        let pointIndex = handleIndex * 2;
        disp.g[pointIndex] = disp.g[pointIndex] + dx;
        disp.g[pointIndex + 1] = disp.g[pointIndex + 1] + dy;
        disp.bounds = null;
    }

    // ---------------
    // Create Handles

    static handlePoints(disp, margin: number): PointI[] {
        console.log(`ERROR: Handles not implemented for ${DispBase.typeOf(disp)}`);
        return [];
    }

    // ---------------
    // Create Method

    static create(coordSet: ModelCoordSet, type): any {
        let newDisp: any = {
            '_tt': type,
        };
        let level = new DispLevel();
        level.id = coordSet.editDefaultLevelId;

        let layer = new DispLayer();
        layer.id = coordSet.editDefaultLayerId;

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

    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispBaseT): string {
        return `Type : ${DispBase.niceName(disp)}`;
    }

    static cloneDisp(disp: DispBaseT): DispBaseT {
        let copy = deepCopy(disp);

        // Copy over the lookup tuples, as they would have been cloned as well.
        for (let key of Object.keys(disp)) {
            if (disp[key] != null && disp[key]['__rst'] != null)
                copy[key] = disp[key];
        }

        // Clear out the Bounds object
        delete copy['bounds'];

        return copy;
    }
}