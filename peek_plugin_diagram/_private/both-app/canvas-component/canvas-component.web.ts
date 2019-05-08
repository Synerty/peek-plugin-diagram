import {Component, Input, ViewChild} from "@angular/core";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig.web";
import {PeekDispRenderFactory} from "../canvas/PeekDispRenderFactory.web";
import {PeekCanvasRenderer} from "../canvas/PeekCanvasRenderer.web";
import {PeekCanvasInput} from "../canvas/PeekCanvasInput.web";
import {PeekCanvasModel} from "../canvas/PeekCanvasModel.web";
import {GridObservable} from "../cache/GridObservable.web";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {DispGroupCache} from "../cache/DispGroupCache.web";

import {DispBase} from "../tuples/shapes/DispBase";

import * as $ from "jquery";
import {PeekCanvasBounds} from "../canvas/PeekCanvasBounds";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {PrivateDiagramBranchService} from "@peek/peek_plugin_diagram/_private/branch/PrivateDiagramBranchService";

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
    @ViewChild('edittoolbar') editToolbarView;
    @ViewChild('canvas') canvasView;

    @Input("modelSetKey")
    modelSetKey: string;

    private canvas: any = null;

    coordSetKey: string | null = null;

    // DoCheck last value variables
    private lastCanvasSize: string = "";
    private lastFrameSize: string = "";

    config: PeekCanvasConfig;

    private renderer: PeekCanvasRenderer;
    private renderFactory: PeekDispRenderFactory;
    private model: PeekCanvasModel;
    input: PeekCanvasInput;
    editor: PeekCanvasEditor;

    // Private services
    private _privatePosService: PrivateDiagramPositionService;
    private coordSetCache: PrivateDiagramCoordSetService;


    constructor(private balloonMsg: Ng2BalloonMsgService,
                private gridObservable: GridObservable,
                private lookupService: DiagramLookupService,
                abstractCoordSetCache: DiagramCoordSetService,
                private dispGroupCache: DispGroupCache,
                positionService: DiagramPositionService,
                private itemSelectService: PrivateDiagramItemSelectService,
                private branchService: PrivateDiagramBranchService) {
        super();

        // Cast the private services
        this.coordSetCache = <PrivateDiagramCoordSetService>abstractCoordSetCache;
        this._privatePosService = <PrivateDiagramPositionService>positionService;

        // The config for the canvas
        this.config = new PeekCanvasConfig();


    }

    private initCanvas(): void {
        // this.lookupService must not be null

        // The model view the viewable items on the canvas
        this.model = new PeekCanvasModel(this.config, this.gridObservable, this.lookupService, this);

        // The display renderer delegates
        this.renderFactory = new PeekDispRenderFactory(this.config, this.dispGroupCache);

        // The user interaction handler.
        this.input = new PeekCanvasInput(
            this.config, this.model, this.renderFactory, this
        );

        // The canvas renderer
        this.renderer = new PeekCanvasRenderer(
            this.config, this.model, this.renderFactory, this
        );

        // The canvas renderer
        this.editor = new PeekCanvasEditor(this.balloonMsg,
            this.input, this.model, this.config, this.lookupService, this.branchService, this
        );

        // Add the mouse class to the renderers draw list
        this.renderer.drawEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(({ctx, zoom, pan}) => this.input.draw(ctx, zoom, pan));

        // Hook up the item selection service
        this.connectItemSelectionService();

        // Hook up the position serivce
        this.connectDiagramService();

        // Hook up the outward notification of position updates
        this.connectPositionUpdateNotify();

    }

    isReady(): boolean {
        return this.coordSetCache.isReady()
            && this.gridObservable.isReady()
            && this.lookupService != null;

    }

    ngOnInit() {
        this.initCanvas();

        this.dispGroupCache.setModelSetKey(this.modelSetKey);

        this.canvas = this.canvasView.nativeElement;

        this.input.setCanvas(this.canvas);
        this.renderer.setCanvas(this.canvas);

        let jqCanvas = $(this.canvas);


        $("body").css("overflow", "hidden");
        // NOTE: If you're debugging diagram flickering, it might help to remove this.
        jqCanvas.parent().css("background-color", this.config.renderer.backgroundColor);

        // Update the canvas height
        this.doCheckEvent
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => {
                let frameSize = `${$(window).height()}`;

                let editToolbarHeight = $(this.editToolbarView.nativeElement).height();

                let titleBarHeight = $(".peek-title-bar").height();
                let footerBarHeight = $(".peek-footer").height();
                let isDesktop = $(".peek-ds-mh-title").height() != null;

                frameSize += `;${titleBarHeight}`;
                frameSize += `;${footerBarHeight}`;
                frameSize += `;${editToolbarHeight}`;

                if (this.lastFrameSize == frameSize)
                    return;

                this.lastFrameSize = frameSize;

                // console.log(this.lastFrameSize);
                // console.log(`titleBarHeight=${titleBarHeight}`);
                // console.log(`footerBarHeight=${footerBarHeight}`);
                // console.log(`editToolbarView=${editToolbarHeight}`);

                let newHeight = $(window).height() - editToolbarHeight;

                if (isDesktop) {
                    newHeight -= 6;
                } else if (titleBarHeight != null && footerBarHeight != null) {
                    newHeight -= (titleBarHeight + footerBarHeight + 6);
                }

                console.log(`newHeight=${newHeight}`);

                jqCanvas.css("height", `${newHeight}px`);
                jqCanvas.css("width", "100%");
                this.config.invalidate();
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

        let coordSet = this.coordSetCache.coordSetForKey(this.modelSetKey, coordSetKey);
        this.config.updateCoordSet(coordSet);

        this._privatePosService.setTitle(`Viewing ${coordSet.name}`);

        // Update
        this.config.updateCoordSet(coordSet);
        this.coordSetKey = coordSetKey;

        // Inform the position service that it's ready to go.
        this._privatePosService.setReady(true);

    }

    connectPositionUpdateNotify(): void {

        let notify = () => {
            if (this.config.controller.coordSet == null)
                return;

            this._privatePosService.positionUpdated({
                coordSetKey: this.config.controller.coordSet.key,
                x: this.config.viewPort.pan.x,
                y: this.config.viewPort.pan.y,
                zoom: this.config.viewPort.zoom,
            });
        };

        this.config.viewPort.panChange
            .takeUntil(this.onDestroyEvent)
            .subscribe(notify);

        this.config.viewPort.zoomChange
            .takeUntil(this.onDestroyEvent)
            .subscribe(notify);

        this.config.controller.coordSetChange
            .takeUntil(this.onDestroyEvent)
            .subscribe(notify);

    }

    connectItemSelectionService(): void {
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

        // Watch the positionByCoordSet observable
        this._privatePosService.positionByCoordSetObservable()
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
                // Switch only if we need to
                if (this.config.controller.coordSet == null
                    || this.config.controller.coordSet.key != pos.coordSetKey) {
                    this.switchToCoordSet(pos.coordSetKey);
                }

                this.config.updateViewPortPan({x: pos.x, y: pos.y}); // pos confirms to PanI
                this.config.updateViewPortZoom(pos.zoom);

                if (pos.highlightKey != null)
                    this.model.tryToSelectKeys([pos.highlightKey]);
            });

    }

}