import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";


import {
    PopupLayerSelectionArgsI,
    PrivateDiagramConfigService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {DispLayer} from "@peek/peek_plugin_diagram/lookups";

import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";

@Component({
    selector: 'pl-diagram-view-select-layers',
    templateUrl: 'select-layers.component.web.html',
    styleUrls: ['select-layers.component.web.scss'],
    moduleId: module.id
})
export class SelectLayersComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @ViewChild('modalView') modalView;

    private backdropId = 'div.modal-backdrop';
    popupShown: boolean = false;

    @Input("coordSetKey")
    coordSetKey: string;

    @Input("modelSetKey")
    modelSetKey: string;

    @Input("config")
    config: PeekCanvasConfig;

    private coordSetService: PrivateDiagramCoordSetService;

    items: DispLayer[] = [];

    constructor(private titleService: TitleService,
                private lookupService: DiagramLookupService,
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

        this.popupShown = true;
        this.platformOpen();
    }

    closePopup(): void {
        this.popupShown = false;
        this.platformClose();

        // Discard the integration additions
        this.items = [];
    }

    platformOpen(): void {
        // .modal is defined in bootstraps code
        let jqModal: any = $(this.modalView.nativeElement);

        jqModal.modal({
            backdrop: 'static',
            keyboard: false
        });

        // Move the backdrop
        let element = $(this.backdropId).detach();
        jqModal.parent().append(element);
    }

    platformClose(): void {
        let jqModal: any = $(this.modalView.nativeElement);
        jqModal.modal('hide');
    }


    noItems(): boolean {
        return this.items.length == 0;
    }

    toggleVisible(layer: DispLayer): void {
        layer.visible = !layer.visible;
        if (this.config != null)
            this.config.setModelNeedsCompiling();

    }


}