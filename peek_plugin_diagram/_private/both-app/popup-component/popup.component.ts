import {Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";


import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    DiagramItemDetailI,
    DiagramItemPopupService,
    DiagramMenuItemI
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";


export abstract class PopupComponentBase extends ComponentLifecycleEventEmitter
    implements OnInit {

    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    protected itemPopupService: PrivateDiagramItemPopupService;

    details: DiagramItemDetailI[] = [];
    menuItems: DiagramMenuItemI[] = [];

    popupShown: boolean = false;

    constructor(protected titleService: TitleService,
                protected itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super();

        this.itemPopupService = <PrivateDiagramItemPopupService> abstractItemPopupService;

        this.itemSelectService
            .itemSelectObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: SelectedItemDetailsI) => this.openPopup(v));

    }

    ngOnInit() {
       this.openPopup({
            "modelSetKey":"modelSetKey",
            "coordSetKey":"coordSetKey",
            "dispKey":"dispKey",
            "dispData":"dispData",

        });
    }

    protected openPopup(itemDetails: SelectedItemDetailsI) {
        this.dispKey = itemDetails.dispKey;
        this.popupShown = true;
        this.itemPopupService.setPopupShown(true);

        // Tell any observers that we're popping up
        // Give them a chance to add their items
        this.itemPopupService.emitPopupContext(
                {
                    key: this.dispKey,
                    data: itemDetails.dispData,
                    coordSetKey: this.coordSetKey,
                    modelSetKey: this.modelSetKey,
                    addMenuItem: (item: DiagramMenuItemI) => this.menuItems.push(item),
                    addDetailItems: (items: DiagramItemDetailI[]) => this.details.add(items),
                }
            );

        this.platformOpen();
    }

    closePopup(): void {
        this.popupShown = false;
        this.itemPopupService.setPopupShown(false);
        this.platformClose();

        // Discard the integration additions
        this.details = [];
        this.menuItems = [];
        this.dispKey = '';
    }

    protected abstract platformOpen(): void;

    protected abstract platformClose(): void;

    menuItemClicked(item:DiagramMenuItemI):void {
        if (item.callback == null) {
            // Expand Children?
        } else {
            item.callback();
        }
    }

    noMenuItems():boolean {
        return this.menuItems.length == 0;
    }

    noDetails():boolean {
        return this.details.length == 0;
    }


}
