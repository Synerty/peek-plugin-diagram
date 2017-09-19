import {Component, Input} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramItemPopupPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";
import {DiagramItemSelectPrivateService,
SelectedItemDetailsI} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {DiagramToolbarPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";
import {DiagramPositionPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";
import {assert} from "./DiagramUtil";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    styleUrls: ['diagram.component.web.scss'],
    moduleId: module.id
})
export class DiagramComponent extends ComponentLifecycleEventEmitter {

    @Input("modelSetKey")
    modelSetKey: string;

    popupShown: boolean = false;

    currentPopupDispKey:string|null = null;
    currentPopupCoordSetKey:string|null = null;


    private privateItemPopupService: DiagramItemPopupPrivateService;
    private privatePositionService: DiagramPositionPrivateService;
    private privateToolbarService: DiagramToolbarPrivateService;

    constructor(private titleService: TitleService,
                private privateItemSelectService: DiagramItemSelectPrivateService,
                itemPopupService: DiagramItemPopupService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService) {
        super();

        this.privateItemPopupService = <DiagramItemPopupPrivateService> itemPopupService;
        this.privatePositionService = <DiagramPositionPrivateService> positionService;
        this.privateToolbarService = <DiagramToolbarPrivateService> toolbarService;

        // Set the title
        this.titleService.setTitle("Loading Canvas ...");

        // Listen to the title service
        this.privatePositionService.titleUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((title: string) => this.titleService.setTitle(title));

        // Set the popup state for the *ngIf
        this.privateItemPopupService.popupShownObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((shown: boolean) => this.popupShown = shown);

        // Connect the ItemSelect to the ItemPopup
        this.privateItemSelectService.itemSelectObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((details: SelectedItemDetailsI) => {

                assert(this.modelSetKey == details.modelSetKey,
                    "This item select is for the wrong modelSetKey");

                this.currentPopupDispKey = details.itemKey;
                this.currentPopupCoordSetKey = details.coordSetKey;

                this.privateItemPopupService.popupShownSubject.next(true);

            });
    }

}
