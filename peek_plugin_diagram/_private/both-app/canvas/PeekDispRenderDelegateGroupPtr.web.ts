import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispGroupCache} from "../cache/DispGroupCache.web";
import {DispGroupPointer} from "../tuples/shapes/DispGroupPointer";
import {PeekCanvasBounds} from "./PeekCanvasBounds";

export class PeekDispRenderDelegateGroupPtr extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig,
                private renderFactory/*: PeekDispRenderFactory*/,
                private dispGroupCache: DispGroupCache) {
        super(config);

    }

    draw(disp, ctx, zoom, pan) {

        let dispGroup = this.dispGroupCache.dispGroupForId(
            DispGroupPointer.targetGroupId(disp)
        );

        if (dispGroup == null)
            return;

        // Give more meaning to our short field names
        let pointX = disp.g[0];
        let pointY = disp.g[1];
        let rotation = disp.r / 180.0 * Math.PI;
        let verticalScale = DispGroupPointer.verticalScale(disp);
        let horizontalScale = DispGroupPointer.horizontalScale(disp);

        ctx.save();
        ctx.translate(pointX, pointY);
        ctx.rotate(rotation);
        ctx.scale(verticalScale, horizontalScale);

        // Draw the items for the group we point to
        for (let i = 0; i < dispGroup.length; i++) {
            let dispItem = dispGroup[i];
            this.renderFactory.draw(dispItem, ctx, zoom, pan);
        }

        ctx.restore();

        disp.bounds = PeekCanvasBounds.fromGeom(disp.g);

    };

    drawSelected(polyObj, ctx, zoom, pan) {

    };

    contains(polyObj, x, y, margin) {
        return false;
    };

    withIn(polyObj, x, y, w, h) {
        return false;
    };

    handles(polyObj) {
        return [];
    };

    deltaMove(polyObj, dx, dy) {
    };

    area(dispEllipse) {
        return 0;
    };

}