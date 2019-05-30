// ============================================================================
// Editor Ui Mouse

import {EditorToolType} from "./PeekCanvasEditorToolType.web";
import {PeekCanvasInput} from "./PeekCanvasInput.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekCanvasModel} from "./PeekCanvasModel.web";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory.web";
import {PeekCanvasEditor} from "./PeekCanvasEditor.web";
import {DispBase, PointI} from "../tuples/shapes/DispBase";


export function disableContextMenu(event) {
    event.preventDefault();
    return false;
}

export class CanvasInputPos {
    x: number = 0;
    y: number = 0;
    clientX: number = 0;
    clientY: number = 0;
    time: Date = new Date();
}

export interface InputDelegateConstructorArgs {
    input: PeekCanvasInput;
    config: PeekCanvasConfig;
    model: PeekCanvasModel;
    renderFactory: PeekDispRenderFactory;
}

/*
 * This class manages the currently selected tool
 * 
 */
export abstract class PeekCanvasInputDelegate {

    _CanvasInput = null;

    _lastMousePos: CanvasInputPos = new CanvasInputPos();

    /** The distance to move before its a drag * */
    readonly DRAG_START_THRESHOLD = 5;

    /** The time it takes to do a click, VS a click that moved slighltly * */
    readonly DRAG_TIME_THRESHOLD = 200;

    protected constructor(protected viewArgs: InputDelegateConstructorArgs,
                          protected canvasEditor: PeekCanvasEditor,
                          public NAME: EditorToolType) {
    }

    protected _hasPassedDragThreshold(m1: CanvasInputPos, m2: CanvasInputPos) {
        let d = false;
        // Time has passed
        d = d || ((m2.time.getTime() - m1.time.getTime()) > this.DRAG_TIME_THRESHOLD);
        // Mouse has moved
        d = d || (Math.abs(m1.clientX - m2.clientX) > this.DRAG_START_THRESHOLD);
        d = d || (Math.abs(m1.clientY - m2.clientY) > this.DRAG_START_THRESHOLD);

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

    draw(ctx, zoom: number, pan: PointI, forEdit: boolean) {
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
    protected _setLastMousePos(inputPos: CanvasInputPos) {

        let dx = inputPos.x - this._lastMousePos.x;
        let dy = inputPos.y - this._lastMousePos.y;
        let dClientX = inputPos.clientX - this._lastMousePos.clientX;
        let dClientY = inputPos.clientY - this._lastMousePos.clientY;

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

    protected _addBranchAnchor(x: number, y: number): void {
        if (this.canvasEditor.branchContext == null)
            return;

        let closestDisp = this.viewArgs.model.query
            .closestDispToPoint(
                x, y, (disp) => {
                    let key = DispBase.key(disp);
                    return key != null && key.length != 0;
                }
            );

        // TODO, See how close it is to other disps.
        if (closestDisp != null) {
            this.canvasEditor.branchContext.branchTuple
                .addAnchorDispKey(DispBase.key(closestDisp));
        }

    }

}