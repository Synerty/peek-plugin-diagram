import {Component, Input, ViewChild} from "@angular/core";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";
import {PeekDispRenderFactory} from "../canvas/PeekDispRenderFactory.web";
import {PeekCanvasRenderer} from "../canvas/PeekCanvasRenderer.web";
import {PeekCanvasInput} from "../canvas/PeekCanvasInput.web";
import {PeekCanvasModel} from "../canvas/PeekCanvasModel.web";
import {GridObservable} from "../cache/GridObservable.web";
import {LookupCache} from "../cache/LookupCache.web";
import {DispGroupCache} from "../cache/DispGroupCache.web";
import {CoordSetCache} from "../cache/CoordSetCache.web";

import {DispBase} from "../tuples/shapes/DispBase";

import * as $ from "jquery";
import {PeekCanvasBounds} from "../canvas/PeekCanvasBounds";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {LocationIndexCache} from "../cache/LocationIndexCache.web";

/** Canvas Component
 *
 * This component ties in all the plain canvas TypeScript code with the Angular
 * services and the HTML <canvas> tag.
 */
@Component({
    selector: 'pl-diagram-canvas',
    templateUrl: 'canvas.component.web.html',
    styleUrls: ['canvas.component.web.scss'],
    moduleId: module.id
})
export class CanvasComponent extends ComponentLifecycleEventEmitter {
    // https://stackoverflow.com/questions/32693061/angular-2-typescript-get-hold-of-an-element-in-the-template
    @ViewChild('canvas') canvasView;

    @Input("modelSetKey")
    modelSetKey: string;

    private canvas: any = null;

    coordSetId: number | null = null;

    // DoCheck last value variables
    private lastCanvasSize: string = "";
    private lastWindowHeight: number = 0;

    config: PeekCanvasConfig;

    private renderer: PeekCanvasRenderer;
    private dispDelegate: PeekDispRenderFactory;
    private model: PeekCanvasModel;
    private input: PeekCanvasInput;

    // Private services
    private _privatePosService: PrivateDiagramPositionService;


    constructor(private gridObservable: GridObservable,
                private lookupCache: LookupCache,
                private coordSetCache: CoordSetCache,
                private dispGroupCache: DispGroupCache,
                private positionService: DiagramPositionService,
                private itemSelectService: PrivateDiagramItemSelectService,
                private locationIndexCache: LocationIndexCache) {
        super();

        // Cast the private services
        this._privatePosService = <PrivateDiagramPositionService> positionService;

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

        // Hook up the item selection service
        this.connectItemSelectionService();

        // Hook up the position serivce
        this.connectDiagramService();


    }

    isReady(): boolean {
        return this.coordSetCache.isReady()
            && this.gridObservable.isReady()
            && this.lookupCache.isReady();
        // && this.locationIndexCache.isReady();

    }

    ngOnInit() {
        // this.locationIndexCache.setModelSetKey(this.modelSetKey);
        this.dispGroupCache.setModelSetKey(this.modelSetKey);
        this.coordSetCache.setModelSetKey(this.modelSetKey);
        this.lookupCache.setModelSetKey(this.modelSetKey);

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

    private switchToCoordSet(coordSetKey: string) {

        if (!this.isReady())
            return;

        let coordSet = this.coordSetCache.coordSetForKey(coordSetKey);
        this.config.updateCoordSet(coordSet);

        this._privatePosService.setTitle(`Viewing ${coordSet.name}`);

        // Update
        this.config.updateCoordSet(coordSet);

        // Inform the position service that it's ready to go.
        this._privatePosService.setReady(true);

    }

    connectItemSelectionService() {
        this.model.selectionChangedObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((disps: {}[]) => {

                if (disps.length != 1)
                    return;

                this.itemSelectService.selectItem({
                    modelSetKey: this.modelSetKey,
                    coordSetKey: this.config.controller.coordSet.key,
                    dispKey: DispBase.key(disps[0]),
                    dispData: DispBase.data(disps[0])
                });

            });
    }


    private connectDiagramService(): void {
        // Hook up the isReady event
        let isReadySub = this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                if (!this.isReady())
                    return;

                isReadySub.unsubscribe();
                this._privatePosService.setReady(true);
            });

        // Watch the positionInitial observable
        this._privatePosService.coordSetKeyObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((coordSetKey: string) => {

                if (!this.isReady()) {
                    console.log("ERROR, Position was called before canvas is ready");
                    return;
                }

                this.switchToCoordSet(coordSetKey);
            });

        // Watch the position observable
        this._privatePosService.positionObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe((pos: DiagramPositionI) => {
                if (this.config.controller.coordSet == null) {
                    console.log("ERROR, Failed to update position, coordSet is null");
                    return;
                }

                if (this.config.controller.coordSet.key == pos.coordSetKey) {
                    console.log("ERROR, Failed to update position, coordSet is null");
                    return;
                }

                this.switchToCoordSet(pos.coordSetKey);

                this.config.updateViewPortPan({x: pos.x, y: pos.y}); // pos confirms to PanI
                this.config.updateViewPortZoom(pos.zoom);

            });

    }

}