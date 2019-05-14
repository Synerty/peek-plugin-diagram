import {DispBase, DispBaseT} from "../tuples/shapes/DispBase";
import {DispPolyline} from "../tuples/shapes/DispPolyline";
import {PeekCanvasModel} from "./PeekCanvasModel.web";

// import 'rxjs/add/operator/takeUntil';


export interface PolylineEnd {
    isStart: boolean,
    polylineDisp: any
}

export interface DispFilterCallableT {
    (disp: DispBaseT): boolean;
}

/**
 * Peek Canvas Model
 *
 * This class stores and manages the model of the NodeCoord and ConnCoord
 * objects that are within the viewable area.
 *
 */

export class PeekCanvasModelQuery {


    constructor(private model: PeekCanvasModel) {


    };


// -------------------------------------------------------------------------------------
// Display Items
// -------------------------------------------------------------------------------------

    get viewableDisps(): any[] {
        return this.model.viewableDisps();
    }

    get selectableDisps(): any[] {
        return this.viewableDisps
            .filter(disp => DispBase.isSelectable(disp));
    }

    get selectedDisps(): any[] {
        return this.model.selection.selectedDisps();
    }

    get dispsInSelectedGroups(): any[] {
        return this._dispsForGroups(this.selectedDisps);
    }

    dispsInSameGroup(refDisp): any[] {
        return this._dispsForGroups([refDisp]);
    }

    private _dispsForGroups(disps: any[]): any[] {
        let result = [];
        let selectedGroupIds = {};
        let groupIdsFound = false;

        for (let disp of disps) {
            // DispGroup and DispGroupPtrs are not selectable
            if (DispBase.groupId(disp) != null) {
                selectedGroupIds[DispBase.groupId(disp)] = true;
                groupIdsFound = true;
            }
        }

        if (!groupIdsFound)
            return disps;

        for (let disp of this.viewableDisps) {
            if (selectedGroupIds[DispBase.groupId(disp)] === true)
                result.push(disp);

            else if (selectedGroupIds[DispBase.id(disp)] === true)
                result.push(disp);
        }

        return result;
    }

    polylinesConnectedToDispKey(keys: string[]): PolylineEnd[] {
        let result: PolylineEnd[] = [];
        let keysDict = {};

        for (let key of keys) {
            keysDict[key] = true;
        }

        for (let disp of this.viewableDisps) {
            let startKey = DispPolyline.startKey(disp);
            let endKey = DispPolyline.endKey(disp);

            if (startKey != null && keysDict[startKey] === true)
                result.push({isStart: true, polylineDisp: disp});

            else if (endKey != null && keysDict[endKey] === true)
                result.push({isStart: false, polylineDisp: disp});
        }


        return result;
    }

    closestDispToPoint(x, y, dispFiltCallable: DispFilterCallableT | null = null): DispBaseT | null {
        let closestDisp = null;
        let closestDispDistance = null;

        for (let disp of this.viewableDisps) {
            if (disp.bounds == null)
                continue;

            if (dispFiltCallable != null && !dispFiltCallable(disp))
                continue;

            let distance = disp.bounds.distanceFromPoint({x, y});
            if (closestDisp == null || distance < closestDispDistance) {
                closestDisp = disp;
                closestDispDistance = distance;
            }

        }

        return closestDisp;
    }


}