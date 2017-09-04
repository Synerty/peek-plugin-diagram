import {Subject} from "rxjs";
import {PanI} from "./PeekInterfaces.web";
import {PeekCanvasBounds} from "./PeekCanvasBounds.web";
import {ModelCoordSet} from "../tuples/model/ModelCoordSet";


/**
 * Peek Canvas Data
 *
 * This class is responsible for storing all the data required for the canvas.
 * This includes storing referecnes to Model objects, and settings for this canvas
 */
export class PeekCanvasConfig {
    private static canvasIdCounter = 0;

    canvasId: number;

    controller = {
        updateInterval: 400,
        coordSetChange: new Subject<ModelCoordSet>(),
        coordSet: null
    };

    renderer = {
        invalidate: new Subject<void>(), // Set this to true to cause the renderer to redraw
        drawInterval: 60,
        backgroundColor: 'black',
        selection: {
            color: 'white',
            width: 8,
            lineGap: 6,
            dashLen: 3,
            snapSize: 4
        },
        grid: {
            show: false,
            size: 16,
            color: '#CCC',
            font: '12px Arial',
            lineWidth: 1,
            snapDashedLen: 2
        }
    };

    viewPort = {
        windowChange: new Subject<PeekCanvasBounds>(),
        window: new PeekCanvasBounds(),
        zoomChange: new Subject<number>(),
        panChange: new Subject<PanI>(),
        pan: {
            x: 238255,
            y: 124655
        },
        zoom: 0.5,

        minZoom: 0.01,
        maxZoom: 10
    };

    canvas = {
        windowChange: new Subject<PeekCanvasBounds>(),
        window: new PeekCanvasBounds()
    };

    mouse = {
        currentDelegateName: null,
        phUpDownZoomFactor: 20.0,
        currentViewPortPosition: {x: 0, y: 0},
        currentCanvasPosition: {x: 0, y: 0},
        selecting: {
            color: '#3399FF',
            width: 2,
            lineGap: 2,
            dashLen: 3,
            snapSize: 4,
            margin: 5, // The distance distance that the click can happen from the shape
        },
    };

    model = {
        gridsWaitingForData: 0,
        dispOnScreen: 0
    };

    // Debug data
    debug = {};


    constructor() {
        this.canvasId = PeekCanvasConfig.canvasIdCounter++;
    }


    invalidate() {
        this.renderer.invalidate.next();
    };

    updateViewPortPan(newPan: PanI) {
        this.viewPort.pan = newPan;
        this.viewPort.panChange.next(newPan);
    }

    updateViewPortZoom(newZoom: number) {
        this.viewPort.zoom = newZoom;
        this.viewPort.zoomChange.next(newZoom);
    }

    updateViewPortWindow(newBounds: PeekCanvasBounds) {
        this.viewPort.window = newBounds;
        this.viewPort.windowChange.next(newBounds);
    }

    updateCanvasWindow(newBounds: PeekCanvasBounds) {
        this.canvas.window = newBounds;
        this.canvas.windowChange.next(newBounds);
    }

    updateCoordSet(newCoordSet: ModelCoordSet) {
        this.controller.coordSet = newCoordSet;
        this.controller.coordSetChange.next(newCoordSet);

        this.viewPort.minZoom = newCoordSet.minZoom;
        this.viewPort.maxZoom = newCoordSet.maxZoom;
    }
}