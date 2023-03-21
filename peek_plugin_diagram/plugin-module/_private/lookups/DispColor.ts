import { addTupleType, Tuple } from "@synerty/vortexjs";
import { diagramTuplePrefix } from "@peek/peek_plugin_diagram/_private";
import { ShapeColorTuple } from "@peek/peek_plugin_diagram/lookup_tuples";

@addTupleType
export class DispColor extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DispColor";

    // Tuple Fields
    key: string;
    modelSetKey: string;

    id: number;
    name: string;
    showForEdit: boolean;

    altColor: string;
    swapPeriod: number;
    modelSetId: number;

    darkColor: string;
    lightColor: string;

    constructor() {
        super(DispColor.tupleName);
    }

    getColor(isLightMode: boolean): string {
        return isLightMode ? this.lightColor : this.darkColor;
    }

    toTuple(): ShapeColorTuple {
        const tuple_ = new ShapeColorTuple();
        tuple_.key = this.key;
        tuple_.modelSetKey = this.modelSetKey;

        tuple_.name = this.name;
        tuple_.showForEdit = this.showForEdit;

        tuple_.altColor = this.altColor;
        tuple_.swapPeriod = this.swapPeriod;
        tuple_.darkColor = this.darkColor;
        tuple_.lightColor = this.lightColor;

        return tuple_;
    }
}
