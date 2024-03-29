import { Component } from "@angular/core";
import { BalloonMsgService } from "@synerty/peek-plugin-base-js";
import {
    NgLifeCycleEvents,
    TupleLoader,
    VortexService,
} from "@synerty/vortexjs";
import {
    diagramFilt,
    SettingPropertyTuple,
} from "@peek/peek_plugin_diagram/_private";

@Component({
    selector: "pl-diagram-edit-setting",
    templateUrl: "./edit.component.html",
})
export class EditSettingComponent extends NgLifeCycleEvents {
    items: SettingPropertyTuple[] = [];
    loader: TupleLoader;

    // This must match the dict defined in the admin_backend handler
    private readonly filt = {
        key: "admin.Edit.SettingProperty",
    };

    constructor(
        private balloonMsg: BalloonMsgService,
        vortexService: VortexService,
    ) {
        super();

        this.loader = vortexService.createTupleLoader(this, () =>
            Object.assign({}, this.filt, diagramFilt),
        );

        this.loader.observable.subscribe(
            (tuples: SettingPropertyTuple[]) => (this.items = tuples),
        );
    }

    saveClicked() {
        this.loader
            .save()
            .then(() => this.balloonMsg.showSuccess("Save Successful"))
            .catch((e) => this.balloonMsg.showError(e));
    }

    resetClicked() {
        this.loader
            .load()
            .then(() => this.balloonMsg.showSuccess("Reset Successful"))
            .catch((e) => this.balloonMsg.showError(e));
    }
}
