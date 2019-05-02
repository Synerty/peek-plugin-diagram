import {Component, Input, NgZone, OnInit, ViewChild} from "@angular/core";
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


@Component({
    selector: 'pl-diagram-select-branches',
    templateUrl: 'select-branches.component.web.html',
    styleUrls: ['select-branches.component.web.scss'],
    moduleId: module.id
})
export class SelectBranchesComponent extends ComponentLifecycleEventEmitter
    implements OnInit {
   @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';

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
                abstractItemPopupService: DiagramItemPopupService,
                protected zone:NgZone) {
        super();

        this.itemPopupService = <PrivateDiagramItemPopupService> abstractItemPopupService;

        this.itemSelectService
            .itemSelectObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: SelectedItemDetailsI) => this.openPopup(v));

    }

    ngOnInit() {

    }

    protected openPopup(itemDetails: SelectedItemDetailsI) {
        console.log("Opening select-branches popup");
        this.dispKey = itemDetails.dispKey;
        this.details = [];
        this.menuItems = [];
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
        this.details = [];
        this.menuItems = [];
        this.dispKey = '';
    }

    platformOpen() :void{
        // .modal is defined in bootstraps code
        let jqModal:any = $(this.modalView.nativeElement);

        jqModal.modal({backdrop:'static',
        keyboard:false});

        // Move the backdrop
        let element = $(this.backdropId).detach();
        jqModal.parent().append(element);
    }

    platformClose():void {
        let jqModal:any = $(this.modalView.nativeElement);
        jqModal.modal('hide');
    }

    menuItemClicked(item:DiagramMenuItemI):void {
        if (item.callback == null) {
            // Expand Children?
        } else {
            item.callback();
        }
        if (item.closeOnCallback)
            this.closePopup();
    }

    noMenuItems():boolean {
        return this.menuItems.length == 0;
    }

    noDetails():boolean {
        return this.details.length == 0;
    }


}
