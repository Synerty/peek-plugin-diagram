import { addTupleType, Tuple } from "@synerty/vortexjs";
import { diagramTuplePrefix } from "@peek/peek_plugin_diagram/_private";

@addTupleType
export class DispColor extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DispColor";

    id: number;
    name: string;
    altColor: string;
    swapPeriod: number;
    modelSetId: number;
    showForEdit: boolean;

    darkColor: string;
    lightColor: string;

    constructor() {
        super(DispColor.tupleName);
    }

    getColor(isLightMode: boolean): string {
        return isLightMode ? this.lightColor : this.darkColor;
    }
}
