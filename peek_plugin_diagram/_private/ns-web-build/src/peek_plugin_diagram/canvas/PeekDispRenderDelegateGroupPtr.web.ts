import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {DispGroupCache} from "../cache/DispGroupCache.web";
import {DispGroupPointer} from "../tuples/shapes/DispGroupPointer";

export class PeekDispRenderDelegateGroupPtr extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig,
                private renderFactory/*: PeekDispRenderFactory*/,
                private dispGroupCache: DispGroupCache) {
        super(config);

    }

    draw(dispGroupPtr, ctx, zoom, pan) {

        let dispGroup = this.dispGroupCache.dispGroupForId(
            DispGroupPointer.targetGroupId(dispGroupPtr)
        );

        if (dispGroup == null)
            return;

        // Give more meaning to our short field names
        let pointX = dispGroupPtr.g[0];
        let pointY = dispGroupPtr.g[1];
        let rotation = dispGroupPtr.r / 180.0 * Math.PI;
        let verticalScale = DispGroupPointer.verticalScale(dispGroupPtr);
        let horizontalScale = DispGroupPointer.horizontalScale(dispGroupPtr);

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