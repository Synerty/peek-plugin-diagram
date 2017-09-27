import {Input, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {NavBackService} from "@synerty/peek-util";


import {
    DiagramToolbarService,
    DiagramToolButtonI
} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramToolbarService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";


export class ToolbarComponentBase extends ComponentLifecycleEventEmitter
    implements OnInit {
    dispKey: string;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;


    protected toolbarService: PrivateDiagramToolbarService;
    buttons: DiagramToolButtonI[] = [];

    toolbarIsOpen: boolean = false;

    constructor(abstractToolbarService: DiagramToolbarService,
                protected navBackService: NavBackService) {
        super();

        this.toolbarService = <PrivateDiagramToolbarService> abstractToolbarService;

        this.toolbarService
            .toolButtonsUpdatedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((buttons: DiagramToolButtonI[]) => {
                this.buttons = buttons;
            });

    }

    ngOnInit() {
        this.toolbarService
            .addToolButton(this.modelSetKey,
                this.coordSetKey,
                {
                    name: "test button",
                    tooltip: null,
                    icon: 'pencil',
                    callback: () => alert("Test button clicked"),
                    children: []
                }
            );
    }

    buttonClicked(btn: DiagramToolButtonI): void {
        if (btn.callback != null
        ) {
            btn.callback();
        }
        else {
            // Expand children?
        }

    }

    toggleToolbar(): void {
        this.toolbarIsOpen = !this.toolbarIsOpen;
    }


}
