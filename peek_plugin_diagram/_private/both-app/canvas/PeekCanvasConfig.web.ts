import { Subject } from "rxjs";
import { PanI } from "./PeekInterfaces.web";
import { PeekCanvasBounds } from "./PeekCanvasBounds";
import { ModelCoordSet } from "@peek/peek_plugin_diagram/_private/tuples/ModelCoordSet";
import { EditorToolType } from "./PeekCanvasEditorToolType.web";
import { DrawModeE } from "../canvas-render/PeekDispRenderDrawModeE.web";

/**
 * Peek Canvas Data
 *
 * This class is responsible for storing all the data required for the canvas.
 * This includes storing referecnes to Model objects, and settings for this canvas
 */
export class PeekCanvasConfig {
    private static canvasIdCounter = 0;
    private static backgroundUnset = "#000000";

    canvasId: number;

    controller = {
        updateInterval: 400,
        coordSetChange: new Subject<ModelCoordSet>(),
        coordSet: null,
        modelSetKey: "",
    };

    renderer = {
        invalidate: new Subject<void>(), // Set this to true to cause the renderer to redraw
        drawInterval: 60,
        backgroundColor: PeekCanvasConfig.backgroundUnset,
        isLightMode: false,
        useEdgeColors: false,
        selection: {
            color: "white",
            width: 8,
            lineGap: 6,
            dashLen: 3,
        },
        suggestion: {
            color: "#3399FF",
            width: 2,
            lineGap: 2,
            dashLen: 3,
            margin: 10, // The distance distance that the click can happen from the shape
        },
        editSelection: {
            color: "#3399FF",
            width: 2,
            lineGap: 4,
            dashLen: 3,
            margin: 10, // The distance distance that the click can happen from the shape
        },
        invisible: {
            // Draw invisble items in edit mode
            color: "#808080",
            width: 2,
            dashLen: 2,
        },
        grid: {
            show: false,
            size: 16,
            color: "#CCCCCC",
            font: "12px Arial",
            lineWidth: 1,
            snapDashedLen: 2,
        },
    };

    viewPort = {
        windowChange: new Subject<PeekCanvasBounds>(),
        window: new PeekCanvasBounds(),
        zoomChange: new Subject<number>(),
        panChange: new Subject<PanI>(),
        pan: {
            x: 238255,
            y: 124655,
        },
        zoom: 0.5,

        minZoom: 0.01,
        maxZoom: 10,
    };

    canvas = {
        windowChange: new Subject<PeekCanvasBounds>(),
        window: new PeekCanvasBounds(),
    };

    mouse = {
        currentDelegateName: EditorToolType.SELECT_TOOL,
        phUpDownZoomFactor: 20.0,
        currentViewPortPosition: { x: 0, y: 0 },
        currentCanvasPosition: { x: 0, y: 0 },
        selecting: {
            color: "#3399FF",
            width: 2,
            lineGap: 2,
            dashLen: 3,
            margin: 10, // The distance distance that the click can happen from the shape
        },
    };

    model = {
        // Set this to true to cause the model to rebuild
        needsCompiling: new Subject<void>(),
        gridsWaitingForData: 0,
        dispOnScreen: 0,
        overlayEnabled: true,
    };

    editor = {
        branchKeyChange: new Subject<string | null>(),
        branchKey: null,
        showAllLayers: false,
        showAllLevels: false,
        active: false,
        resizeHandleMargin: 5.0,
        resizeHandleWidth: 30.0,
        selectionHighlightColor: "orange",
        primaryEditActionCompleteColor: "#52C41B",
        primaryEditActionDefaultColor: "#a79e9e",
        primaryEditActionHandleMargin: 40.0,
        primaryEditActionHandleWidth: 20.0,
        activeBranchTuple: null,
        snapToGrid: false,
        snapSize: 4,
    };

    // Debug data
    debug = {};

    constructor() {
        this.canvasId = PeekCanvasConfig.canvasIdCounter++;
    }

    get isLightMode(): boolean {
        return this.renderer.isLightMode;
    }

    set isLightMode(value: boolean) {
        this.renderer.isLightMode = value;
        this.renderer.backgroundColor =
            (this.renderer.isLightMode
                ? this.coordSet?.backgroundLightColor
                : this.coordSet?.backgroundDarkColor) ||
            PeekCanvasConfig.backgroundUnset;
        console.log(
            `Setting background to ${
                this.renderer.isLightMode ? "light" : "dark"
            } mode`
        );
        this.invalidate();
    }

    get coordSet(): ModelCoordSet | null {
        return this.controller.coordSet;
    }

    getSelectionDrawDetailsForDrawMode(drawMode: DrawModeE) {
        switch (drawMode) {
            case DrawModeE.ForView:
                return this.renderer.selection;
            case DrawModeE.ForEdit:
                return this.renderer.editSelection;
            case DrawModeE.ForSuggestion:
                return this.renderer.suggestion;
            default:
                throw new Error(`Invalid drawMode ${drawMode}`);
        }
    }

    invalidate() {
        this.renderer.invalidate.next();
    }

    setModelNeedsCompiling() {
        this.model.needsCompiling.next();
    }

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

        // Update background color
        this.isLightMode = this.isLightMode;

        this.viewPort.minZoom = newCoordSet.minZoom;
        this.viewPort.maxZoom = newCoordSet.maxZoom;

        this.updateViewPortPan({
            x: newCoordSet.initialPanX,
            y: newCoordSet.initialPanY,
        });
        this.updateViewPortZoom(newCoordSet.initialZoom);
    }

    updateEditedBranch(branchKey: string | null): void {
        this.editor.branchKey = branchKey;
        this.editor.branchKeyChange.next(branchKey);
    }
}
