import {Component, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {DiagramToolbarPrivateService} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";


@Component({
    selector: 'pl-diagram-toolbar',
    templateUrl: 'toolbar.component.web.html',
    styleUrls: ['toolbar.component.web.scss'],
    moduleId: module.id
})
export class ToolbarComponent extends ComponentLifecycleEventEmitter
    implements OnInit {


    private toolbarService: DiagramToolbarPrivateService;
    buttons: DiagramToolButtonI[] = [];

    constructor(abstractToolbarService: DiagramToolbarService,
                private navBackService: NavBackService) {
        super();

        this.toolbarService = <DiagramToolbarPrivateService> abstractToolbarService;

        this.toolbarService
            .toolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.buttons = buttons;
            });

    }

    ngOnInit() {
        // Add the back button
        this.toolbarService.addToolButton({
            name: "Back",
            tooltip:  null,
            icon:  null,
            callback: () => this.navBackService.navBack(),
            children:[]
        });

    }

    buttonClicked(btn:DiagramToolButtonI) :void {
        if (btn.callback != null) {
            btn.callback();
        } else {
            // Expand toolbar?
        }

    }


}
