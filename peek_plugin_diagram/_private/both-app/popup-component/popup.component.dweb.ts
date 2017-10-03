import {Component, Input, OnInit, ViewChild, NgZone} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
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
    templateUrl: 'popup.component.dweb.html',
    styleUrls: ['popup.component.dweb.scss'],
    moduleId: module.id
})
export class PopupComponent extends PopupComponentBase {

    constructor(  titleService: TitleService,
                itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService,
                 zone:NgZone) {
        super(titleService, itemSelectService, abstractItemPopupService, zone);

    }

    platformOpen() :void{
    }

    platformClose():void {
    }


}
