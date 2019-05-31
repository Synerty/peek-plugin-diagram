import {DispGroupT} from "../tuples/shapes/DispGroup";
import {DispGroupPointer, DispGroupPointerT} from "../tuples/shapes/DispGroupPointer";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";
import {PeekCanvasModel} from "./PeekCanvasModel.web";

export class PeekCanvasGroupPtrPropsContext {


    constructor(private model: PeekCanvasModel,
                private dispGroupPtr: DispGroupPointerT,
                private lookupService: DiagramLookupService,
                private branchTuple: BranchTuple) {

    }

    setDispGroup(dispGroup: DispGroupT, coordSetId: number): void {
        DispGroupPointer.setDispGroup(
            this.dispGroupPtr, dispGroup, coordSetId,
            this.lookupService, this.branchTuple
        );

        this.model.recompileModel();
    }

    get targetDispGroupCoordSetId(): number | null {
        return DispGroupPointer.targetGroupCoordSetId(this.dispGroupPtr);
    }

    get targetDispGroupName(): string | null {
        return DispGroupPointer.targetGroupName(this.dispGroupPtr);
    }

}
