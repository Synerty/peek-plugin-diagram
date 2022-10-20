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

    private darkColor: string;
    private lightColor: string;

    constructor() {
        super(DispColor.tupleName);
    }

    get color(): string {
        return this.darkColor;
    }

    set color(value) {
        this.darkColor = value;
    }
}
