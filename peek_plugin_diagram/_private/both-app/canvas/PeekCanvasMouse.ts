// ============================================================================
// Editor Ui Mouse

/*
 * This class manages the currently selected tool
 * 
 */
export class PeekCanvasMouse {
    config = null;
    model = null;
    dispDelegate = null;
    _delegate = null;

    canvas = null;

    constructor(private config, private model, private dispDelegate) {
        this.delegateFinished();
    }


    setDelegate(Delegate) {
        if (this._delegate)
            this._delegate.delegateWillBeTornDown();

        this._delegate = new Delegate(this, this.config, this.model, this.dispDelegate);
        this.config.mouse.currentDelegateName = this._delegate.NAME;
    };

    applyUpdates() {

        this.config.renderer.invalidate = true;
        this.scope.$apply();
    };

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
    delegateFinished() {

        let PeekCanvasMouseSelectDelegate =
            requirejs("PeekCanvasMouseSelectDelegate");
        this.setDelegate(PeekCanvasMouseSelectDelegate);
    };

// Creates an object with x and y defined, set to the mouse position relative to
// the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about
// padding and borders
    _getMouse(e) {

        let element = this.canvas;
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
            if (event.changedTouches != null && event.changedTouches.length >= 0) {
                let touch = event.changedTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            } else {
                logWarning("Failed to determine pan coordinates");
            }
        }

        let mx = pageX - offsetX;
        let my = pageY - offsetY;

        let clientX = mx;
        let clientY = my;

        // Apply canvas scale and pan
        let zoom = this.config.canvas.zoom;
        let pan = this.config.canvas.pan;
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

        canvas.addEventListener('keydown', function (e) {
            this._delegate.keyDown(e);
            this.scope.$apply();
        }, true);

        canvas.addEventListener('keypress', function (e) {
            this._delegate.keyPress(e);
            this.scope.$apply();
        }, true);

        canvas.addEventListener('keyup', function (e) {
            this._delegate.keyUp(e);
            this.scope.$apply();
        }, true);

        canvas.addEventListener('mousedown', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.mouseDown(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('mousemove', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.mouseMove(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('mouseup', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.mouseUp(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('mousewheel', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.mouseWheel(e, this._getMouse(e));
            this.scope.$apply();
            e.preventDefault();
            return false;
        }, true);

        canvas.addEventListener('dblclick', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.mouseDoubleClick(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('selectstart', function (e) {
            //this_._delegate.mouseSelectStart(e, this_._getMouse(e));
            e.preventDefault();
            return false;
        }, true);

        canvas.addEventListener('contextmenu', disableContextMenu, true);

        canvas.addEventListener('touchstart', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.touchStart(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('touchmove', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.touchMove(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        canvas.addEventListener('touchend', function (e) {
            if (!e instanceof MouseEvent) return;
            this._delegate.touchEnd(e, this._getMouse(e));
            this.scope.$apply();
        }, true);

        // Watch the size of the canvas, update if it changes
        this.scope.$watch(function () {
            let jq = $(this.canvas);
            let offset = jq.offset();
            return jq.width().toString()
                + "x" + jq.height().toString()
                + "x" + offset.left.toString()
                + "x" + offset.top.toString()
                ;

        }, function () {
            this.updateCanvasSize();
        });
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

        //if (document.defaultView && document.defaultView.getComputedStyle) {
        //    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(
        //                    this.canvas, null)['paddingLeft'], 10) || 0;
        //    this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(
        //                    this.canvas, null)['paddingTop'], 10) || 0;
        //    this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(
        //                    this.canvas, null)['borderLeftWidth'], 10) || 0;
        //    this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(
        //                    this.canvas, null)['borderTopWidth'], 10) || 0;
        //}

        // Some pages have fixed-position bars (like the stumbleupon bar) at the
        // top or left of the page
        // They will mess up mouse coordinates and this fixes that
        let html = document.body.parentNode;
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