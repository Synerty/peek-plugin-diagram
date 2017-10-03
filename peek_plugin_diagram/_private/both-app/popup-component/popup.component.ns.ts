import {Component, Output, EventEmitter, NgZone} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";

import {TitleService} from "@synerty/peek-util";
import {switchStyleUrls} from "@synerty/peek-util/index.ns";


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
    styleUrls: ['./popup.component.ns.scss'],
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {

    @Output("rowspanEvent")
    rowspanEvent = new EventEmitter<number>();

    constructor(  titleService: TitleService,
                itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService,
                 zone:NgZone) {
        super(titleService, itemSelectService, abstractItemPopupService, zone);

    }

    platformOpen(): void {
        this.rowspanEvent.emit(3);
    }

    platformClose(): void {
        this.rowspanEvent.emit(1);
    }

}
