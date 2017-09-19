import {Component, Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramItemPopupPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";


@Component({
    selector: 'pl-diagram-popup',
    templateUrl: 'popup.component.web.html',
    moduleId: module.id
})
export class PopupComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("dispKey")
    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    private itemPopupService: DiagramItemPopupPrivateService;

    details: DiagramItemDetailI[] = [];
    menuItems: DiagramMenuItemI[] = [];


    constructor(private itemSelectService: DiagramItemSelectPrivateService,
                abstractItemPopupService: DiagramItemPopupService) {
        super();

        this.itemPopupService = <DiagramItemPopupPrivateService> abstractItemPopupService;


    }

    ngOnInit() {
        // Tell any observers that we're popping up
        // Give them a chance to add their items
        this.itemPopupService.itemPopupSubject
            .next(
                {
                    key: this.dispKey,
                    coordSetKey: this.coordSetKey,
                    modelSetKey: this.modelSetKey,
                    addMenuItem: (item: DiagramMenuItemI) => this.menuItems.push(item),
                    addDetailItems: (items: DiagramItemDetailI[]) => this.details.add(items),
                }
            );

    }

    closeClicked() {
        this.itemPopupService.popupShownSubject.next(false);
    }


}
