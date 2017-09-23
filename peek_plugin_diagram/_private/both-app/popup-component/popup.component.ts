import {Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";


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

    @Input("dispKey")
    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    protected itemPopupService: PrivateDiagramItemPopupService;

    details: DiagramItemDetailI[] = [];
    menuItems: DiagramMenuItemI[] = [];

    popupShown: boolean = false;

    constructor(protected itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService) {
        super();

        this.itemPopupService = <PrivateDiagramItemPopupService> abstractItemPopupService;

        this.itemSelectService
            .itemSelectObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: SelectedItemDetailsI) => this.openPopup(v));

    }

    ngOnInit() {

    }

    private openPopup(itemDetails: SelectedItemDetailsI) {
        this.popupShown = true;
        this.itemPopupService.setPopupShown(true);

        // Tell any observers that we're popping up
        // Give them a chance to add their items
        this.itemPopupService.emitPopupContext(
                {
                    key: this.dispKey,
                    coordSetKey: this.coordSetKey,
                    modelSetKey: this.modelSetKey,
                    addMenuItem: (item: DiagramMenuItemI) => this.menuItems.push(item),
                    addDetailItems: (items: DiagramItemDetailI[]) => this.details.add(items),
                }
            );

        this.platformOpen();
    }

    protected closePopup(): void {
        this.popupShown = false;
        this.itemPopupService.setPopupShown(false);
        this.platformClose()
    }

    protected abstract platformOpen(): void;

    protected abstract platformClose(): void;


}
