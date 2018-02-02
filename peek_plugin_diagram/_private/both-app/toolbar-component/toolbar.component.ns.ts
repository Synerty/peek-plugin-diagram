import {Component, EventEmitter, Output} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {ToolbarComponentBase} from "./toolbar.component";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.ns.html',
    styleUrls: ['toolbar.component.ns.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ToolbarComponentBase {

    @Output("toolbarRowspanEvent")
    toolbarRowspanEvent = new EventEmitter<number>();

    constructor(abstractToolbarService: DiagramToolbarService) {
        super(abstractToolbarService);



    }

    nsToggleToolbar(): void {
        this.toggleToolbar();
        this.toolbarRowspanEvent.emit(this.toolbarIsOpen ? 2 : 1);

    }

    btnIcon(btn) :string {
        if (btn.icon == null)
            return 'none';
        return 'fa-' + btn.icon;
    }


}
