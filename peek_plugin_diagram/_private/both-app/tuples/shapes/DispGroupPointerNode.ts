import {DispGroupPointer} from "./DispGroupPointer";

export class DispGroupPointerNode extends DispGroupPointer {

    static nodeId(disp) : number {
        return disp.nodeId;
    }

}