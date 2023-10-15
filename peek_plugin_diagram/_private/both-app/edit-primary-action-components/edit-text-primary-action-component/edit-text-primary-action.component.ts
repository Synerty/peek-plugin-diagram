import { Component, OnInit } from "@angular/core";
import { NgLifeCycleEvents } from "@synerty/vortexjs";
import { ContextMenuPopupI } from "../../services/context-menu.service";
import { DispText, DispTextT } from "../../canvas-shapes/DispText";

@Component({
    selector: "pl-diagram-edit-text-primary-action",
    templateUrl: "edit-text-primary-action.component.html",
    styleUrls: ["edit-text-primary-action.component.scss"],
})
export class EditTextPrimaryActionComponent
    extends NgLifeCycleEvents
    implements OnInit
{
    disp: DispTextT | null = null;
    updateCallback: () => void | null = null;
    finishCallback: () => void | null = null;
    modalStyle = {};
    showModal = false;

    constructor() {
        super();
    }

    ngOnInit() {}

    // --------------------
    //

    get text(): string {
        return this.disp ? DispText.text(this.disp) : "";
    }

    set text(value: string) {
        if (this.disp) {
            DispText.setText(this.disp, value);
            this.updateCallback?.();
        }
    }

    open(
        disp,
        event: ContextMenuPopupI,
        finishCallback: () => void,
        updateCallback: () => void
    ) {
        this.updateCallback = updateCallback;
        this.finishCallback = finishCallback;
        this.disp = disp;
        this.modalStyle = {
            top: `${event.y}px`,
            left: `${event.x}px`,
            margin: "20px",
            width: "300px",
        };
        this.showModal = true;
    }

    close() {
        this.finishCallback?.();

        this.showModal = false;
        this.disp = null;
        this.updateCallback = null;
        this.finishCallback = null;
    }
}
