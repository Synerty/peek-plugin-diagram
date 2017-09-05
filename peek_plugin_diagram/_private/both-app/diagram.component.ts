import {Component, Input} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramItemPopupPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";
import {DiagramItemSelectPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {DiagramToolbarPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";
import {DiagramPositionPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    styleUrls : ['diagram.component.web.scss'],
    moduleId: module.id
})
export class DiagramComponent extends ComponentLifecycleEventEmitter {

    private privateItemPopupService: DiagramItemPopupPrivateService;
    private privatePositionService: DiagramPositionPrivateService;
    private privateToolbarService: DiagramToolbarPrivateService;

    constructor(private titleService:TitleService,
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
        this.privatePositionService.titleUpdatedSubject
            .takeUntil(this.onDestroyEvent)
            .subscribe((title:string) => this.titleService.setTitle(title));
    }


}
