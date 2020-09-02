import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import { TitleService } from "@synerty/peek-plugin-base-js"


import {
    PopupLayerSelectionArgsI,
    PrivateDiagramConfigService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {PrivateDiagramLookupService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {DispLayer} from "@peek/peek_plugin_diagram/lookups";

import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";
import {PeekCanvasModel} from "../canvas/PeekCanvasModel.web";

@Component({
    selector: 'pl-diagram-view-select-layers',
    templateUrl: 'select-layers.component.web.html',
    styleUrls: ['select-layers.component.web.scss'],
    moduleId: module.id
})
export class SelectLayersComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    popupShown: boolean = false;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    @Input("model")
    model: PeekCanvasModel;

    @Input("config")
    config: PeekCanvasConfig;

    private coordSetService: PrivateDiagramCoordSetService;

    items: DispLayer[] = [];

    constructor(private titleService: TitleService,
                private lookupService: PrivateDiagramLookupService,
                private configService: PrivateDiagramConfigService,
                abstractCoordSetService: DiagramCoordSetService) {
        super();

        this.coordSetService = <PrivateDiagramCoordSetService>abstractCoordSetService;

        this.configService
            .popupLayerSelectionObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((v: PopupLayerSelectionArgsI) => this.openPopup(v));

    }

    ngOnInit() {

    }

    protected openPopup({coordSetKey, modelSetKey}) {
        let coordSet = this.coordSetService.coordSetForKey(modelSetKey, coordSetKey);
        console.log("Opening Layer Select popup");

        this.items = this.lookupService.layersOrderedByOrder(coordSet.modelSetId);
        this.items.sort((a, b) =>
            a.name == b.name ? 0 : a.name < b.name ? -1 : 1
        );

        this.popupShown = true;
    }

    closePopup(): void {
        this.popupShown = false;
        this.items = [];
    }


    noItems(): boolean {
        return this.items.length == 0;
    }

    toggleLayerVisible(layer: DispLayer): void {
        layer.visible = !layer.visible;
        if (this.model != null)
            this.model.recompileModel();

    }



}
