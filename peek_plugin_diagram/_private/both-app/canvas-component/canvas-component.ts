import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {TitleService} from "@synerty/peek-util";

import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig";
import {PeekDispRenderFactory} from "../canvas/PeekDispRenderFactory";
import {PeekCanvasRenderer} from "../canvas/PeekCanvasRenderer";
import {PeekCanvasInput} from "../canvas/PeekCanvasInput";
import {PeekCanvasModel} from "../canvas/PeekCanvasModel";
import {GridObservable} from "../cache/GridObservable";
import {LookupCache} from "../cache/LookupCache";
import {DispGroupCache} from "../cache/DispGroupCache";
import {CoordSetCache} from "../cache/CoordSetCache";

import * as $ from "jquery";
import {PeekCanvasBounds} from "../canvas/PeekCanvasBounds";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {
    DiagramPositionI,
    DiagramPositionPrivateService
} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

export interface DispItemSelectedI {
    key: string;
    modelSetKey: string;
    coordSetKey: string;
}

@Component({
    selector: 'pl-diagram-canvas',
    templateUrl: 'canvas.component.html',
    styleUrls: ['canvas.component.css'],
    moduleId: module.id
})
export class CanvasComponent extends ComponentLifecycleEventEmitter {
    // https://stackoverflow.com/questions/32693061/angular-2-typescript-get-hold-of-an-element-in-the-template
    @ViewChild('canvas') canvasView;
    private canvas: any = null;

    @Input("coordSetId") coordSetId: number;

    @Output("itemSelected") itemSelectedEvent = new EventEmitter<DispItemSelectedI>();

    // DoCheck last value variables
    private lastCoordSetId: number | null = null;
    private lastCanvasSize: string = "";
    private lastWindowHeight: number = 0;

    config: PeekCanvasConfig;

    private renderer: PeekCanvasRenderer;
    private dispDelegate: PeekDispRenderFactory;
    private model: PeekCanvasModel;
    private input: PeekCanvasInput;


    constructor(private titleService: TitleService,
                private gridObservable: GridObservable,
                private lookupCache: LookupCache,
                private coordSetCache: CoordSetCache,
                private dispGroupCache: DispGroupCache,
                private positionService: DiagramPositionService) {
        super();

        // Set the title
        this.titleService.setTitle("Loading Canvas ...");

        // The config for the canvas
        this.config = new PeekCanvasConfig();

        // The model view the viewable items on the canvas
        this.model = new PeekCanvasModel(this.config, gridObservable, lookupCache, this);

        // The display renderer delegates
        this.dispDelegate = new PeekDispRenderFactory(this.config, dispGroupCache);

        // The user interaction handler.
        this.input = new PeekCanvasInput(
            this.config, this.model, this.dispDelegate, this
        );

        // The canvas renderer
        this.renderer = new PeekCanvasRenderer(
            this.config, this.model, this.dispDelegate, this
        );

        // Add the mouse class to the renderers draw list
        this.renderer.drawEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(ctx => this.input.draw(ctx));

        // Watch the coordSetId
        this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                if (!this.isReady() || this.lastCoordSetId == this.coordSetId)
                    return;

                if (this.coordSetId == null)
                    return;

                this.lastCoordSetId = this.coordSetId;

                let coordSet = this.coordSetCache.coordSetForId(this.coordSetId);
                this.config.updateCoordSet(coordSet);
                this.titleService.setTitle(`Viewing ${coordSet.name}`);
            });

        // Hook up the position server
        this.connectDiagramService(<DiagramPositionPrivateService> positionService);


    }

    isReady(): boolean {
        return this.coordSetCache.isReady()
            && this.gridObservable.isReady()
            && this.lookupCache.isReady();

    }

    ngOnInit() {
        this.canvas = this.canvasView.nativeElement;

        this.input.setCanvas(this.canvas);
        this.renderer.setCanvas(this.canvas);

        let jqCanvas = $(this.canvas);

        $("body").css("overflow", "hidden");

        // Update the canvas height
        this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                let height = $(window).height();

                if (this.lastWindowHeight == height)
                    return;

                this.lastWindowHeight = height;


                let newHeight = height - jqCanvas.offset().top;

                jqCanvas.css("height", `${newHeight}px`);
                jqCanvas.css("width", "100%");
            });

        // Watch the canvas window size
        this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                let offset = jqCanvas.offset();
                let bounds = new PeekCanvasBounds(
                    offset.left, offset.top, jqCanvas.width(), jqCanvas.height()
                );
                let thisCanvasSize = bounds.toString();

                if (this.lastCanvasSize == thisCanvasSize)
                    return;

                this.lastCanvasSize = thisCanvasSize;

                this.canvas.height = this.canvas.clientHeight;
                this.canvas.width = this.canvas.clientWidth;

                this.config.updateCanvasWindow(bounds);
            });
    }

    mouseInfo(): string {
        let x = this.config.mouse.currentViewPortPosition.x.toFixed(2);
        let y = this.config.mouse.currentViewPortPosition.y.toFixed(2);
        let zoom = this.config.viewPort.zoom.toFixed(2);
        return `${x}x${y}X${zoom}, ${this.config.model.dispOnScreen} Items`;
    }

    private connectDiagramService(service: DiagramPositionPrivateService): void {
        service.positionObservable
            .takeUntil(this.onDestroyEvent)
            .subscribe((pos: DiagramPositionI) => {

            });

    }

}