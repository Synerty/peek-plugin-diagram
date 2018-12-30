import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "../PluginNames";
import {DiagramDeltaBase} from "../../branch/DiagramDeltaBase";
import {ModelSet} from "@peek/peek_plugin_diagram";


@addTupleType
export class DiagramBranchTuple extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "DiagramBranchTuple";

    modelSetKey: string;
    coordSetKey: string;
    key: string;

    deltas: DiagramDeltaBase[] = [];

    // Properties
    visible: boolean = false;

    constructor() {
        super(DiagramBranchTuple.tupleName)
    }

    static unpackJson(key: string, packedJson: string): DiagramBranchTuple {
        // Reconstruct the data
        let objectProps: {} = JSON.parse(packedJson);

        // Get out the object type
        let thisBranchTypeId = objectProps['_tid'];
        delete objectProps['_tid'];

        // Get out the object type
        let thisModelSetId = objectProps['_msid'];
        delete objectProps['_msid'];

        // Create the new object
        let newSelf = new DiagramBranchTuple();

        newSelf.modelSetKey = objectProps["modelSetKey"];
        newSelf.coordSetKey = objectProps["coordSetKey"];
        newSelf.key = key;

        // Unpack the custom data here
        newSelf.deltas = objectProps["deltas"];
        newSelf.visible = objectProps["visible"];

        return newSelf;

    }
}