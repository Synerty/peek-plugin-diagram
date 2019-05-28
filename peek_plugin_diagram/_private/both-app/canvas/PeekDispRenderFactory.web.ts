import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PeekDispRenderDelegatePoly} from "./PeekDispRenderDelegatePoly.web";
import {PeekDispRenderDelegateText} from "./PeekDispRenderDelegateText.web";
import {PeekDispRenderDelegateEllipse} from "./PeekDispRenderDelegateEllipse.web";
import {PeekDispRenderDelegateAction} from "./PeekDispRenderDelegateAction.web";
import {PeekDispRenderDelegateGroupPtr} from "./PeekDispRenderDelegateGroupPtr.web";
import {DispGroupCache} from "../cache/DispGroupCache.web";
import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DispBase} from "../tuples/shapes/DispBase";
import {DispFactory, DispType} from "../tuples/shapes/DispFactory";


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


    _initBounds(disp) {
        if (disp.bounds == null) {
            disp.bounds = PeekCanvasBounds.fromGeom(disp.g);
        }
    };


    draw(disp, ctx, zoom, pan) {
        let level = DispBase.level(disp);
        if (level == null) {
            console.log("HERE");
            return;
        }
        if (!(level.minZoom <= zoom && zoom <= level.maxZoom))
            return;

        if (this._delegatesByType[disp._tt] == null)
            console.log(disp._tt);
        this._delegatesByType[disp._tt].draw(disp, ctx, zoom, pan);
    };

    drawSelected(disp, ctx, zoom:number, pan) {
        this._delegatesByType[disp._tt].drawSelected(disp, ctx, zoom, pan);
    };

    drawSelectedForEdit(disp, ctx, zoom: number, pan) {
        this.drawSelected(disp, ctx, zoom, pan);
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

        if (DispFactory.type(disp1) == DispType.groupPointer
            && DispFactory.type(disp2) != DispType.groupPointer)
            return 1;

        if (DispFactory.type(disp1) == DispType.polygon
            && DispFactory.type(disp2) != DispType.polygon)
            return 1;



        return this._delegatesByType[disp2._tt].area(disp2)
            - this._delegatesByType[disp1._tt].area(disp1);

    };
}