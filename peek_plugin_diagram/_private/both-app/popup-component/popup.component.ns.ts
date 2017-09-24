import {Component} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {TitleService} from "@synerty/peek-util";


import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {PopupComponentBase} from "./popup.component";


@Component({
    selector: 'pl-diagram-popup',
    templateUrl: 'popup.component.ns.html',
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {


    constructor(titleService: TitleService,
                itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super(titleService, itemSelectService, abstractItemPopupService);


    }

    platformOpen(): void {
        this.titleService.setEnabled(false);
    }

    platformClose(): void {
        this.titleService.setEnabled(true);
    }

}
