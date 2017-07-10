import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekCanvasModel} from "./PeekCanvasModel";

import * as $ from "jquery";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory";
import {disableContextMenu, PeekCanvasInputDelegate} from "./PeekCanvasInputDelegate";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PeekCanvasInputSelectDelegate} from "./PeekCanvasInputSelectDelegate";


/** Peek Canvas Input
 *
 * This class manages the user input of the canvas
 *
 */
export class PeekCanvasInput {
    private _delegate: PeekCanvasInputDelegate = null;

    private canvas = null;

    // Canvas size calculations
    private width: number = 0;
    private height: number = 0;

    private stylePaddingLeft: number = 0;
    private stylePaddingTop: number = 0;
    private styleBorderLeft: number = 0;
    private styleBorderTop: number = 0;

    private htmlTop: number = 0;
    private htmlLeft: number = 0;

    constructor(private config: PeekCanvasConfig,
                private model: PeekCanvasModel,
                private dispDelegate: PeekDispRenderFactory,
                private lifecycleEventEmitter: ComponentLifecycleEventEmitter) {
        this.delegateFinished();
    }


    setDelegate(Delegate) {
        if (this._delegate)
            this._delegate.shutdown();

        this._delegate = new Delegate(this, this.config, this.model, this.dispDelegate);
        this.config.mouse.currentDelegateName = this._delegate.NAME;
    };


// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
    delegateFinished() {

        // let PeekCanvasInputSelectDelegate =
        //     require("PeekCanvasInputSelectDelegate")["PeekCanvasInputSelectDelegate"];
        this.setDelegate(PeekCanvasInputSelectDelegate);
    };

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
    _getMouse(e) {

        let element: any = this.canvas;
        let offsetX = 0;
        let offsetY = 0;

        // Compute the total offset
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        // Also add the <html> offsets in case there's a position:fixed bar
        offsetX += this.stylePaddingLeft + this.styleBorderLeft
            + this.htmlLeft + this.width / 2;
        offsetY += this.stylePaddingTop + this.styleBorderTop
            + this.htmlTop + this.height / 2;

        let pageX = e.pageX;
        let pageY = e.pageY;

        if (pageX == null) {
            if (e.changedTouches != null && e.changedTouches.length >= 0) {
                let touch = e.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            } else {
                console.log("ERROR: Failed to determine pan coordinates");
            }
        }

        let mx = pageX - offsetX;
        let my = pageY - offsetY;

        let clientX = mx;
        let clientY = my;

        // Apply canvas scale and pan
        let zoom = this.config.viewPort.zoom;
        let pan = this.config.viewPort.pan;
        mx = mx / zoom + pan.x;
        my = my / zoom + pan.y;

        if (isNaN(mx))
            console.log("mx IS NaN");


        this.config.mouse.currentPosition = {x: mx, y: my};

        // We return a simple javascript object (a hash) with x and y defined
        return {
            x: mx,
            y: my,
            clientX: clientX,
            clientY: clientY,
            time: new Date()
        };
    };

    setCanvas(canvas) {


        this.canvas = canvas;

        canvas.addEventListener('keydown', (e) => {
            this._delegate.keyDown(e);

        }, true);

        canvas.addEventListener('keypress', (e) => {
            this._delegate.keyPress(e);

        }, true);

        canvas.addEventListener('keyup', (e) => {
            this._delegate.keyUp(e);

        }, true);

        canvas.addEventListener('mousedown', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.mouseDown(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('mousemove', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.mouseMove(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('mouseup', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.mouseUp(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('mousewheel', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.mouseWheel(e, this._getMouse(e));

            e.preventDefault();
            return false;
        }, true);

        canvas.addEventListener('dblclick', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.mouseDoubleClick(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('selectstart', (e) => {
            //this_._delegate.mouseSelectStart(e, this_._getMouse(e));
            e.preventDefault();
            return false;
        }, true);

        canvas.addEventListener('contextmenu', disableContextMenu, true);

        canvas.addEventListener('touchstart', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.touchStart(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('touchmove', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.touchMove(e, this._getMouse(e));

        }, true);

        canvas.addEventListener('touchend', (e) => {
            if (!(e instanceof MouseEvent)) return;
            this._delegate.touchEnd(e, this._getMouse(e));

        }, true);

        this.config.canvas.windowChange
            .takeUntil(this.lifecycleEventEmitter.doCheckEvent)
            .subscribe(() => this.updateCanvasSize());

    };

    updateCanvasSize() {

        let jqCanvas = $(this.canvas);

        this.width = jqCanvas.width();
        this.height = jqCanvas.height();

        // This complicates things a little but but fixes mouse co-ordinate
        // problems
        // when there's a border or padding. See getMouse for more detail
        this.stylePaddingLeft = parseInt(jqCanvas.css('padding-left')) || 0;
        this.stylePaddingTop = parseInt(jqCanvas.css('padding-top')) || 0;
        this.styleBorderLeft = parseInt(jqCanvas.css('border-left-width')) || 0;
        this.styleBorderTop = parseInt(jqCanvas.css('border-top-width')) || 0;

        // Some pages have fixed-position bars (like the stumbleupon bar) at the
        // top or left of the page
        // They will mess up mouse coordinates and this fixes that
        let html: any = document.body.parentNode;
        this.htmlTop = html.offsetTop;
        this.htmlLeft = html.offsetLeft;

    };

    /**
     * Draw Called by the renderer during a redraw.
     */
    draw(ctx) {


        if (this._delegate)
            this._delegate.draw(ctx);
    };

}