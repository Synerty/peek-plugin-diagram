import {DispBase, DispBaseT, DispHandleI, PointI} from "./DispBase";
import {PeekCanvasShapePropsContext} from "../canvas/PeekCanvasShapePropsContext";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples";
import {DispGroup, DispGroupT} from "./DispGroup";
import {PrivateDiagramLookupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService";
import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";
import {
    calculateRotationAfterPointMove,
    movePointFurtherFromPoint,
    rotatePointAboutCenter
} from "./DispUtil";

export interface DispGroupPointerT extends DispBaseT {

    // targetGroupId
    tg: number;

    // verticalScale
    vs: number;

    // horizontalScale
    hs: number;

    // Name
    tn: string;

    // Rotation
    r: number;

    // Disps that belong to this disp group
    // Set by the model compiler
    // COMPUTED PROPERTY, it's computed somewhere
    disps: any[];

}

export class DispGroupPointer extends DispBase {

    static targetGroupId(disp: DispGroupPointerT): number {
        return disp.tg;
    }

    static setTargetGroupId(disp: DispGroupPointerT, val: number): void {
        disp.tg = val;
    }

    static setTargetGroupName(disp: DispGroupPointerT, coordSetId: number,
                              name: string): void {
        disp.tn = `${coordSetId}|${name}`;
    }

    static targetGroupCoordSetId(disp: DispGroupPointerT): number | null {
        if (disp.tn == null || disp.tn.indexOf('|') === -1)
            return null;
        return parseInt(disp.tn.split('|')[0]);
    }

    static targetGroupName(disp: DispGroupPointerT): string | null {
        if (disp.tn == null || disp.tn.indexOf('|') === -1)
            return null;
        return disp.tn.split('|')[1];
    }

    static verticalScale(disp: DispGroupPointerT): number {
        return disp.vs;
    }

    static horizontalScale(disp: DispGroupPointerT): number {
        return disp.hs;
    }

    static rotation(disp: DispGroupPointerT): number {
        if (disp.r == null)
            return 0;
        return disp.r;
    }

    static setRotation(disp: DispGroupPointerT, val: number): void {
        disp.r = val;
    }

    static center(disp: DispGroupPointerT): PointI {
        return {x: disp.g[0], y: disp.g[1]};
    }

    static setCenterPoint(disp: DispGroupPointerT, x: number, y: number): void {
        disp.g = [x, y];
    }

    // ---------------
    // Delta move helpers


    static deltaMoveHandle(handle: DispHandleI, dx: number, dy: number) {
        const disp = <DispGroupPointerT>handle.disp;
        if (disp.g == null)
            return;

        if (handle.handleIndex != 0) {
            console.log("ERROR: DispGroup only has one handle, "
                + `${handle.handleIndex} passed`);
            return;
        }

        const center = DispGroupPointer.center(disp);

        if (handle.lastDeltaPoint == null) {
            const startPoint: PointI = handle.handle.center();
            handle.lastDeltaPoint = {
                x: startPoint.x,
                y: startPoint.y
            };
        }

        const nextPoint = {
            x: handle.lastDeltaPoint.x + dx,
            y: handle.lastDeltaPoint.y + dy
        };

        const rotationDegrees = calculateRotationAfterPointMove(
            center, handle.lastDeltaPoint, nextPoint
        );

        handle.lastDeltaPoint = nextPoint;

        console.log(disp.r);

        DispGroupPointer.setRotation(disp,
            DispGroupPointer.rotation(disp) + rotationDegrees);


        for (const childDisp of disp.disps) {
            DispBase.rotateAboutAxis(childDisp, center, rotationDegrees);
        }
    }

    static rotateAboutAxis(disp, center: PointI, rotationDegrees: number) {
        console.log("NOT IMPLEMENTED: Rotateing child DispGroupPtrs");
    }

    // ---------------
    // Create Method

    static create(coordSet: ModelCoordSet): DispGroupPointerT {
        let newDisp = {
            ...DispBase.create(coordSet, DispBase.TYPE_DGP),
            // From Text
            'tg': null, // TextVerticalAlign.targetGroupId
            'vs': 1.0, // TextHorizontalAlign.verticalScale
            'hs': 1.0,  // TextHorizontalAlign.horizontalScale
        };

        DispGroupPointer.setSelectable(newDisp, true);
        DispGroupPointer.setCenterPoint(newDisp, 0, 0);

        return newDisp;
    }

    static makeShapeContext(context: PeekCanvasShapePropsContext): void {
        DispBase.makeShapeContext(context);

        // context.addProp(new ShapeProp(
        //     ShapePropType.MultilineString,
        //     DispGroupPointer.text,
        //     DispGroupPointer.setText,
        //     "Text"
        // ));
        //
        // context.addProp(new ShapeProp(
        //     ShapePropType.TextStyle,
        //     DispGroupPointer.textStyle,
        //     DispGroupPointer.setTextStyle,
        //     "Text Style"
        // ));
        //
        // context.addProp(new ShapeProp(
        //     ShapePropType.Color,
        //     DispGroupPointer.color,
        //     DispGroupPointer.setColor,
        //     "Color"
        // ));
    }


    // ---------------
    // Represent the disp as a user friendly string

    static makeShapeStr(disp: DispGroupPointerT): string {
        let center = DispGroupPointer.center(disp);
        let str = DispBase.makeShapeStr(disp);
        if (DispGroupPointer.targetGroupName(disp))
            str += `\nName : ${DispGroupPointer.targetGroupName(disp)}`;
        str += `\nAt : ${parseInt(<any>center.x)}x${parseInt(<any>center.y)}`;
        return str;
    }

    /** Set Disp Group
     *
     * Change the template that this disp groupd points to.
     *
     * This is achived by deleting the current disp items in this group,
     * and adding the new templates in.
     *
     * @param dispGroupPtr
     * @param groupDisp
     * @param lookupService
     * @param branchTuple
     */
    static setDispGroup(dispGroupPtr: DispGroupPointerT,
                        groupDisp: DispGroupT,
                        groupDispCoordSetId: number,
                        lookupService: PrivateDiagramLookupService,
                        branchTuple: BranchTuple): void {
        let center = DispGroupPointer.center(dispGroupPtr);

        let oldDisps = branchTuple.disps
            .filter((d) => DispBase.groupId(d) == DispBase.id(dispGroupPtr));

        branchTuple.removeDisps(oldDisps);
        let coordSetId = branchTuple.coordSetId;
        let thisCoordSetLevelsByOrder = {};
        for (let level of lookupService.levelsOrderedByOrder(coordSetId)) {
            thisCoordSetLevelsByOrder[level.order] = level;
        }

        function findLevel(oldLevel): any {
            return thisCoordSetLevelsByOrder[oldLevel.order];
        }

        let newDisps = [];
        for (let disp of DispGroup.items(groupDisp)) {
            disp = DispBase.cloneDisp(disp);
            DispBase.setSelectable(disp, false);
            DispBase.setKey(disp, null);
            DispBase.setId(disp, null);
            DispBase.setReplacesHashId(disp, null);
            DispBase.setHashId(disp, null);

            lookupService._linkDispLookups(disp);

            // Convert this to this coord sets levels
            DispBase.setLevel(disp, findLevel(DispBase.level(disp)));

            DispBase.deltaMove(disp, center.x, center.y);
            DispBase.setGroupId(disp, DispBase.id(dispGroupPtr));
            newDisps.push(disp);
        }

        DispGroupPointer.setTargetGroupName(
            dispGroupPtr,
            groupDispCoordSetId,
            DispGroup.groupName(groupDisp)
        );
        branchTuple.addNewDisps(newDisps);
    }

    static handlePoints(disp, margin: number): PointI[] {
        const bounds = disp.bounds;
        if (bounds == null) {
            console.log("No bounds, exiting");
            return [];
        }

        const cp = DispGroupPointer.center(disp);
        const maxRadius = Math.max.apply(Math, [
            Math.hypot(bounds.x + bounds.w - cp.x, cp.y - bounds.y),
            Math.hypot(cp.x - bounds.x, bounds.y + bounds.h - cp.y),
            Math.hypot(bounds.x + bounds.w - cp.x, cp.y - bounds.y),
            Math.hypot(cp.x - bounds.x, bounds.y + bounds.h - cp.y)
        ]);

        let handle = {x: cp.x, y: cp.y + maxRadius};
        const rotationDegrees = DispGroupPointer.rotation(disp);

        if (rotationDegrees != 0)
            handle = rotatePointAboutCenter(cp, handle, rotationDegrees + 5);

        handle = movePointFurtherFromPoint(cp, handle, margin);
        return [handle];
    }
}