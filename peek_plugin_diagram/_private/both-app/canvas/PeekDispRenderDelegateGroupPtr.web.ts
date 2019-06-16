import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DrawModeE, PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispBaseT, PointI} from "../canvas-shapes/DispBase";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {DispGroupPointer, DispGroupPointerT} from "../canvas-shapes/DispGroupPointer";

export class PeekDispRenderDelegateGroupPtr extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    updateBounds(disp: DispBaseT): void {
        let group = <DispGroupPointerT>disp;
        disp.bounds = PeekCanvasBounds.fromPoints([DispGroupPointer.center(group)]);
    }

    draw(dispGroup, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
        // let b = dispGroup.bounds;
        //
        // if (b == null || b.w == 0 || b.w == 0) {
        //     let geom = [];
        //     // Draw the items for the group we point to
        //     for (let dispItem in DispGroupPointer.items(dispGroup)) {
        //         if (dispItem["g"] != null)
        //             geom.add(dispItem["g"]);
        //     }
        //
        //     if (geom.length == 0)
        //         return;
        //     dispGroup.bounds = PeekCanvasBounds.fromGeom(geom);
        // }
        //
        //
        // ctx.beginPath();
        // ctx.moveTo(b.x, b.y);
        // ctx.lineTo(b.x, b.y + b.h);
        // ctx.lineTo(b.x + b.w, b.y + b.h);
        // ctx.lineTo(b.x + b.w, b.y);
        // ctx.lineTo(b.x, b.y);
        // ctx.strokeStyle = 'red';
        // ctx.lineWidth = 5.0 / zoom;
        // ctx.stroke();

        //
        // // Give more meaning to our short field names
        // let pointX = dispGroup.g[0];
        // let pointY = dispGroup.g[1];
        // let rotation = dispGroup.r / 180.0 * Math.PI;
        // let verticalScale = DispGroupPointer.verticalScale(dispGroup);
        // let horizontalScale = DispGroupPointer.horizontalScale(dispGroup);
        //
        // ctx.save();
        // ctx.translate(pointX, pointY);
        // ctx.rotate(rotation);
        // ctx.scale(verticalScale, horizontalScale);
        //
        // // Draw the items for the group we point to
        // for (let dispItem in DispGroupPointer.items(dispGroup)) {
        //     this.renderFactory.draw(dispItem, ctx, zoom, pan);
        // }
        //
        // ctx.restore();
        //
        // disp.bounds = PeekCanvasBounds.fromGeom(disp.g);

    };

    drawSelected(disp, ctx, zoom: number, pan: PointI, drawMode: DrawModeE) {
    };

    drawEditHandles(disp, ctx, zoom: number, pan: PointI) {

    }

}