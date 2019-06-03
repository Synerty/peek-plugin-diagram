import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PeekDispRenderDelegatePoly} from "./PeekDispRenderDelegatePoly.web";
import {PeekDispRenderDelegateText} from "./PeekDispRenderDelegateText.web";
import {PeekDispRenderDelegateEllipse} from "./PeekDispRenderDelegateEllipse.web";
import {PeekDispRenderDelegateGroupPtr} from "./PeekDispRenderDelegateGroupPtr.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DispBase, DispType, PointI} from "../canvas-shapes/DispBase";
import {PeekDispRenderDelegateNull} from "./PeekDispRenderDelegateNull.web";


export class PeekDispRenderFactory {
    private _delegatesByType: {};

    constructor(private config: PeekCanvasConfig) {

        let polyDelegate = new PeekDispRenderDelegatePoly(config);
        let textDelegate = new PeekDispRenderDelegateText(config);
        let ellipseDelegate = new PeekDispRenderDelegateEllipse(config);
        let groupPtrDelegate = new PeekDispRenderDelegateGroupPtr(config);
        let nullDelegate = new PeekDispRenderDelegateNull(config);

        this._delegatesByType = {};
        this._delegatesByType[DispBase.TYPE_DT] = textDelegate;
        this._delegatesByType[DispBase.TYPE_DPG] = polyDelegate;
        this._delegatesByType[DispBase.TYPE_DPL] = polyDelegate;
        this._delegatesByType[DispBase.TYPE_DE] = ellipseDelegate;
        this._delegatesByType[DispBase.TYPE_DGP] = groupPtrDelegate;
        this._delegatesByType[DispBase.TYPE_DN] = nullDelegate;

    }


    _initBounds(disp) {
        if (disp.bounds == null) {
            disp.bounds = PeekCanvasBounds.fromGeom(disp.g);
        }
    };


    draw(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        let level = DispBase.level(disp);
        let layer = DispBase.layer(disp);

        let isVisible = (level.minZoom <= zoom && zoom <= level.maxZoom)
            || this.config.editor.showAllLevels;

        isVisible = isVisible && (layer.visible || this.config.editor.showAllLayers);

        // Ignore everything not visible.
        if (!forEdit && !isVisible)
            return;

        let delegate = this._delegatesByType[disp._tt];
        if (delegate == null)
            console.log(`ERROR: Unhandled render delegate for ${disp._tt}`);

        // Draw only visible shapes
        if (isVisible)
            delegate.draw(disp, ctx, zoom, pan, forEdit);

        // Update the bounds of all shapes
        if (disp.bounds == null)
            delegate.updateBounds(disp, zoom);

        // Show invisible objects
        if (forEdit)
            this.drawInvisible(disp, ctx, zoom, pan);
    };

    private drawInvisible(disp, ctx, zoom: number, pan: PointI) {
        if (disp.lcl || disp.fcl || disp.cl)
            return;

        if (!disp.bounds)
            return;

        if (DispBase.typeOf(disp) == DispType.null_)
            return;

        // DRAW THE invisible BOX
        let selectionConfig = this.config.renderer.invisible;

        let b = disp.bounds;

        ctx.dashedRect(b.x, b.y, b.w, b.h, selectionConfig.dashLen / zoom);
        ctx.strokeStyle = selectionConfig.color;
        ctx.lineWidth = selectionConfig.width / zoom;
        ctx.stroke();
    }

    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        this._delegatesByType[disp._tt].drawSelected(disp, ctx, zoom, pan, forEdit);
    };


    drawEditHandles(disp, ctx, zoom: number, pan: PointI) {
        this._delegatesByType[disp._tt].drawEditHandles(disp, ctx, zoom, pan);
    };

    contains(disp, x, y, margin) {

        this._initBounds(disp);
        return this._delegatesByType[disp._tt].contains(disp, x, y, margin);
    };

    withIn(disp, x, y, w, h) {
        this._initBounds(disp);
        return this._delegatesByType[disp._tt].withIn(disp, x, y, w, h);
    };

    similarTo(disp, otherDispObj) {
        return false;
    };

    handles(disp) {
        return this._delegatesByType[disp._tt].handles(disp);
    };

    area(disp) {
        this._initBounds(disp);
        return this._delegatesByType[disp._tt].area(disp);
    };

    selectionPriorityCompare(disp1, disp2): number {

        if (DispBase.typeOf(disp1) == DispType.groupPointer
            && DispBase.typeOf(disp2) != DispType.groupPointer)
            return 1;

        if (DispBase.typeOf(disp1) == DispType.polygon
            && DispBase.typeOf(disp2) != DispType.polygon)
            return 1;


        return this._delegatesByType[disp2._tt].area(disp2)
            - this._delegatesByType[disp1._tt].area(disp1);

    };
}