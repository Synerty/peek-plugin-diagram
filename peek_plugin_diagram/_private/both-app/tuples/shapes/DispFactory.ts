import {DispEllipse} from "./DispEllipse";
import {DispText} from "./DispText";
import {DispPolygon} from "./DispPolygon";
import {DispPolyline} from "./DispPolyline";
import {DispGroupPointer} from "./DispGroupPointer";
import {DispGroup} from "./DispGroup";
import {DispNull} from "./DispNull";

export enum DispType {
    ellipse,
    polygon,
    polyline,
    text,
    group,
    groupPointer,
    null_

}

/** Disp Base
 *
 * There will be potentially tens of thousands of disp object in memory at once.
 *
 * In order to reduce the overhead, These wrapper classes have been created entierly
 * statically.
 *
 * This way the code can benefit from typing while still maintaining the small footprint
 * of the disp objects.
 *
 * Who knows, maybe the data will converted from a json object to a packed string in
 * future.
 *
 */
export class DispFactory {


    private static typeMap = {
        'DT': [DispType.text, DispText],
        'DPG': [DispType.polygon, DispPolygon],
        'DPL': [DispType.polyline, DispPolyline],
        'DE': [DispType.ellipse, DispEllipse],
        'DG': [DispType.group, DispGroup],
        'DGP': [DispType.groupPointer, DispGroupPointer],
        'DN': [DispType.null_, DispNull],
    };

    static type(disp): DispType {
        return DispFactory.typeMap[disp._tt][0];
    }

    static wrapper(disp) {
        return DispFactory.typeMap[disp._tt][1];
    }


}