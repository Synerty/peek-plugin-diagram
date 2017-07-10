import {Component, Input, ViewChild} from "@angular/core";

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


@Component({
    selector: 'pl-diagram-canvas',
    templateUrl: 'canvas.component.html',
    styleUrls: ['canvas.component.css'],
    moduleId: module.id
})
export class CanvasComponent extends ComponentLifecycleEventEmitter {
    // https://stackoverflow.com/questions/32693061/angular-2-typescript-get-hold-of-an-element-in-the-template
    @ViewChild('canvas') canvas;

    @Input("coordSetId") coordSetId: number;
    private lastCoordSetId: number | null = null;

    config: PeekCanvasConfig;

    private renderer: PeekCanvasRenderer;
    private dispDelegate: PeekDispRenderFactory;
    private model: PeekCanvasModel;
    private input: PeekCanvasInput;


    constructor(private titleService: TitleService,
                private gridObservable: GridObservable,
                private lookupCache: LookupCache,
                private coordSetCache: CoordSetCache,
                private dispGroupCache: DispGroupCache) {
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

                let coordSet = this.coordSetCache.coordSetForId(this.coordSetId);
                this.config.updateCoordSet(coordSet);
                this.titleService.setTitle(`Viewing ${coordSet.name}`);
            });

    }

    isReady() : boolean {
        return this.coordSetCache.isReady()
        && this.gridObservable.isReady()
        && this.lookupCache.isReady();

    }

    ngOnInit() {
        this.input.setCanvas(this.canvas.nativeElement);
        this.renderer.setCanvas(this.canvas.nativeElement);
    }

    mouseInfo(): string {
        let x = this.config.mouse.currentPosition.x.toFixed(2);
        let y = this.config.mouse.currentPosition.y.toFixed(2);
        let zoom = this.config.canvas.zoom.toFixed(2);
        return `${x}x${y}X${zoom}, ${this.config.model.dispOnScreen} Items`;
    }

}