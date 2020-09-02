import {Input} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import { TitleService } from "@synerty/peek-plugin-base-js"


export class DiagramComponentBase extends ComponentLifecycleEventEmitter {

    @Input("modelSetKey")
    modelSetKey: string;

    coordSetKey: string|null = null;

    nsToolbarRowSpan = 1;
    nsPopupRowSpan = 1;

    protected privatePositionService: PrivateDiagramPositionService;
    protected privateToolbarService: PrivateDiagramToolbarService;

    constructor(protected titleService: TitleService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService) {
        super();

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
