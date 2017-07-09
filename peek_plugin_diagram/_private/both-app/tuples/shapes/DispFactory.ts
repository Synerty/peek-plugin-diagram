import {DispEllipse} from "./DispEllipse";
import {DispAction} from "./DispAction";
import {DispText} from "./DispText";
import {DispPolygon} from "./DispPolygon";
import {DispPolyline} from "./DispPolyline";
import {DispGroupPointer} from "./DispGroupPointer";
import {DispGroup} from "./DispGroup";
import {DispGroupPointerNode} from "./DispGroupPointerNode";
import {DispPolylineConn} from "./DispPolylineConn";

export enum DispType {
    ellipse,
    polygon,
    polyline,
    text,
    action,
    groupPointerNode,
    polylineConn,
    group,
    groupPointer

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
        'DT':[DispType.text, DispText],
        'DPG':[DispType.polygon, DispPolygon],
        'DPL':[DispType.polyline, DispPolyline],
        'DE':[DispType.ellipse, DispEllipse],
        'DA':[DispType.text, DispAction],
        'DG':[DispType.group, DispGroup],
        'DGP':[DispType.groupPointer, DispGroupPointer],
        'DGPN':[DispType.groupPointerNode, DispGroupPointerNode],
        'DPLC':[DispType.polylineConn, DispPolylineConn],
    };

    static type(disp) : DispType {
        return DispFactory.typeMap[disp._tt][0];
    }

    static wrapper(disp)  {
        return DispFactory.typeMap[disp._tt][1];
    }
}