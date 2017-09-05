import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PeekDispRenderDelegatePoly} from "./PeekDispRenderDelegatePoly.web";
import {PeekDispRenderDelegateText} from "./PeekDispRenderDelegateText.web";
import {PeekDispRenderDelegateEllipse} from "./PeekDispRenderDelegateEllipse.web";
import {PeekDispRenderDelegateAction} from "./PeekDispRenderDelegateAction.web";
import {PeekDispRenderDelegateGroupPtr} from "./PeekDispRenderDelegateGroupPtr.web";
import {DispGroupCache} from "../cache/DispGroupCache.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DispBase} from "../tuples/shapes/DispBase";
export class PeekDispRenderFactory {
    private _delegatesByType: {};

    constructor(config: PeekCanvasConfig, dispGroupCache: DispGroupCache) {


        let polyDelegate = new PeekDispRenderDelegatePoly(config);
        let textDelegate = new PeekDispRenderDelegateText(config);
        let ellipseDelegate = new PeekDispRenderDelegateEllipse(config);
        let actionDelegate = new PeekDispRenderDelegateAction(config);
        let groupPtrDelegate = new PeekDispRenderDelegateGroupPtr(
            config, this, dispGroupCache
        );

        this._delegatesByType = {
            'DT': textDelegate,
            'DPG': polyDelegate,
            'DPL': polyDelegate,
            'DE': ellipseDelegate,
            'DA': actionDelegate,
            'DGP': groupPtrDelegate
        };

    }


    _initBounds(dispObj) {
        if (dispObj.bounds == null) {
            dispObj.bounds = PeekCanvasBounds.fromGeom(dispObj.g);
        }
    };


    draw(dispObj, ctx, zoom, pan) {
        let level = DispBase.level(dispObj);
        if (!(level.minZoom <= zoom && zoom <= level.maxZoom))
            return;

        if (this._delegatesByType[dispObj._tt] == null)
            console.log(dispObj._tt);
        this._delegatesByType[dispObj._tt].draw(dispObj, ctx, zoom, pan);
    };

    drawSelected(dispObj, ctx, zoom, pan) {

        this._delegatesByType[dispObj._tt].drawSelected(dispObj, ctx, zoom, pan);
    };

    contains(dispObj, x, y, margin) {

        this._initBounds(dispObj);
        return this._delegatesByType[dispObj._tt].contains(dispObj, x, y, margin);
    };

    withIn(dispObj, x, y, w, h) {

        this._initBounds(dispObj);
        return this._delegatesByType[dispObj._tt].withIn(dispObj, x, y, w, h);
    };

    similarTo(dispObj, otherDispObj) {
        return false;
    };

    handles(dispObj) {

        return this._delegatesByType[dispObj._tt].handles(dispObj);
    };

    deltaMove(dispObj, dx, dy) {

        this._initBounds(dispObj);
        return this._delegatesByType[dispObj._tt].deltaMove(dx, dy);
    };

    area(dispObj) {

        this._initBounds(dispObj);
        return this._delegatesByType[dispObj._tt].area(dispObj);
    };

    selectionPriotityCompare(dispObj1, dispObj2) {

        if (dispObj1._tt == 'DA' && dispObj2._tt != 'DA')
            return -1;

        if (dispObj1._tt != 'DA' && dispObj2._tt == 'DA')
            return 1;

        return dispObj2.bounds.area() - dispObj1.bounds.area();
    };
}