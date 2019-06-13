import {Component, Input, NgZone, OnInit} from "@angular/core";
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
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";


@Component({
    selector: 'pl-diagram-view-popup',
    templateUrl: 'popup.component.web.html',
    styleUrls: ['popup.component.web.scss'],
    moduleId: module.id
})
export class PopupComponent  extends ComponentLifecycleEventEmitter
    implements OnInit {

    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    protected itemPopupService: PrivateDiagramItemPopupService;

    details: DiagramItemDetailI[] = [];

    private parentMenuItems: DiagramMenuItemI[][] = [];
    menuItems: DiagramMenuItemI[] = [];

    popupShown: boolean = false;

    constructor(protected titleService: TitleService,
                protected itemSelectService: PrivateDiagramItemSelectService,
                abstractItemPopupService: DiagramItemPopupService,
                protected zone: NgZone) {
        super();

        this.itemPopupService = <PrivateDiagramItemPopupService>abstractItemPopupService;

        this.itemSelectService
            .itemSelectObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: SelectedItemDetailsI) => this.openPopup(v));

    }

    ngOnInit() {

    }

    private reset(){

        this.details = [];
        this.parentMenuItems = [];
        this.menuItems = [];
        this.dispKey = '';
    }

    protected openPopup(itemDetails: SelectedItemDetailsI) {
        console.log("Opening popup");
        this.reset();
        this.dispKey = itemDetails.dispKey;
        this.popupShown = true;
        this.itemPopupService.setPopupShown(true);

        // Tell any observers that we're popping up
        // Give them a chance to add their items
        this.itemPopupService.emitPopupContext(
            {
                key: this.dispKey,
                data: itemDetails.dispData || {},
                coordSetKey: this.coordSetKey,
                modelSetKey: this.modelSetKey,
                addMenuItem: (item: DiagramMenuItemI) => {
                    this.zone.run(() => this.menuItems.push(item));
                },
                addDetailItems: (items: DiagramItemDetailI[]) => {
                    this.zone.run(() => this.details.add(items));
                }
            }
        );

        this.platformOpen();
    }

    closePopup(): void {
        this.popupShown = false;
        this.itemPopupService.setPopupShown(false);
        this.platformClose();

        // Discard the integration additions
        this.reset();
    }

    platformOpen(): void {
    }

    platformClose(): void {
    }

    menuItemClicked(item: DiagramMenuItemI): void {
         if (item.children != null && item.children.length != 0) {
            this.parentMenuItems.push(this.menuItems);
            this.menuItems = item.children;
        } else {
            item.callback();
        }
        if (item.closeOnCallback)
            this.closePopup();
    }

    noMenuItems(): boolean {
        return this.menuItems.length == 0;
    }

    showGoUpParentButton(): boolean {
        return this.parentMenuItems.length != 0;
    }

    goUpParentButtonClicked(): void {
        this.menuItems = this.parentMenuItems.pop();
    }

    noDetails(): boolean {
        return this.details.length == 0;
    }

}