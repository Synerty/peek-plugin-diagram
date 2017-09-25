import {Component, Input} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramItemPopupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {PrivateDiagramItemSelectService,
SelectedItemDetailsI} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

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

    coordSetKey: string|null = null;

    nsToolbarRowSpan = 1;
    nsPopupRowSpan = 1;

    private privateItemPopupService: PrivateDiagramItemPopupService;
    private privatePositionService: PrivateDiagramPositionService;
    private privateToolbarService: PrivateDiagramToolbarService;

    constructor(private titleService: TitleService,
                private privateItemSelectService: PrivateDiagramItemSelectService,
                itemPopupService: DiagramItemPopupService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService) {
        super();

        this.privateItemPopupService = <PrivateDiagramItemPopupService> itemPopupService;
        this.privatePositionService = <PrivateDiagramPositionService> positionService;
        this.privateToolbarService = <PrivateDiagramToolbarService> toolbarService;

        // Set the title
        this.titleService.setTitle("Loading Canvas ...");

        // Listen to the title service
        this.privatePositionService.titleUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((title: string) => this.titleService.setTitle(title));

    }

}
