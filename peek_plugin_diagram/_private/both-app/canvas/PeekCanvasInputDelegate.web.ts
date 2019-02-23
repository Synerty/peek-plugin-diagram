// ============================================================================
// Editor Ui Mouse

export class LastMousePos {

    x: number = 0;
    y: number = 0;
    clientX: number = 0;
    clientY: number = 0;
}

export class MousePos {
    x: number = 0;
    y: number = 0;
}

export function disableContextMenu(event) {
    event.preventDefault();
    return false;
}

export interface CanvasInputPos {
    x: number,
    y: number,
    clientX: number,
    clientY: number,
    time: Date
}

/*
 * This class manages the currently selected tool
 * 
 */
export abstract class PeekCanvasInputDelegate {

    _CanvasInput = null;

    _lastMousePos: LastMousePos = new LastMousePos();

    /** The distance to move before its a drag * */
    readonly DRAG_START_THRESHOLD = 5;

    /** The time it takes to do a click, VS a click that moved slighltly * */
    readonly DRAG_TIME_THRESHOLD = 200;

    constructor(public NAME: string) {
    }

    _hasPassedDragThreshold(m1, m2) {
        let d = false;
        // Time has passed
        d = d || ((m2.time.getTime() - m1.time.getTime()) > this.DRAG_TIME_THRESHOLD);
        // Mouse has moved
        d = d || (Math.abs(m1.x - m2.x) > this.DRAG_START_THRESHOLD);
        d = d || (Math.abs(m1.y - m2.y) > this.DRAG_START_THRESHOLD);

        return d;
    };

    keyDown(event) {
    };

    keyPress(event) {
    };

    keyUp(event) {
    };

    // mouseSelectStart(event, mouse) {
    // };

    mouseDown(event: MouseEvent, mouse: CanvasInputPos) {
    };

    mouseMove(event: MouseEvent, mouse: CanvasInputPos) {
    };

    mouseUp(event: MouseEvent, mouse: CanvasInputPos) {
    };

    mouseDoubleClick(event: MouseEvent, mouse: CanvasInputPos) {
    };

    mouseWheel(event: MouseEvent, mouse: CanvasInputPos) {
    };

    touchStart(event: TouchEvent, mouse: CanvasInputPos) {
    };

    touchMove(event: TouchEvent, mouse: CanvasInputPos) {
    };

    touchEnd(event: TouchEvent, mouse: CanvasInputPos) {
    };

    shutdown() {
    };

    draw(ctx) {
    };

    /**
     * Set Last Mouse Pos
     *
     * Sets the last mouse pos depending on the snap
     *
     * @param the
     *            current mouse object
     * @return An object containing the delta
     */
    _setLastMousePos(mouse) {

        let dx = mouse.x - this._lastMousePos.x;
        let dy = mouse.y - this._lastMousePos.y;
        let dClientX = mouse.clientX - this._lastMousePos.clientX;
        let dClientY = mouse.clientY - this._lastMousePos.clientY;

        //if (editorUi.grid.snapping()) {
        //	let snapSize = editorUi.grid.snapSize();
        //	dx = Coord.snap(dx, snapSize);
        //	dy = Coord.snap(dy, snapSize);
        //}

        this._lastMousePos.x += dx;
        this._lastMousePos.y += dy;
        this._lastMousePos.clientX += dClientX;
        this._lastMousePos.clientY += dClientY;

        return {
            dx: dx,
            dy: dy,
            dClientX: dClientX,
            dClientY: dClientY
        };
    };

    /*
    newObjectLayer() {
        let selectedLayers = editorLayer.selectedLayers();
        if (selectedLayers.length)
            return selectedLayers[selectedLayers.length - 1].id;

        return editorLayer.lastLayer().id;

    };
    */

}