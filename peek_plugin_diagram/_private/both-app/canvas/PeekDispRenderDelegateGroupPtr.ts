import {PeekDispRefData} from "./PeekDispRefData";
import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC";
import {PeekDispRenderFactory} from "./PeekDispRenderFactory";

export class PeekDispRenderDelegateGroupPtr extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig, refData: PeekDispRefData, private renderFactory/*: PeekDispRenderFactory*/) {
        super(config, refData);

    }

    draw(dispGroupPtr, ctx, zoom, pan) {

        let dispGroup = peekModelCache.dispGroupForId(dispGroupPtr.gid);

        if (dispGroup == null)
            return;

        // Give more meaning to our short field names
        let point = dispGroupPtr.g[0];
        let rotation = dispGroupPtr.r / 180.0 * Math.PI;
        let verticalScale = dispGroupPtr.vs;
        let horizontalScale = dispGroupPtr.hs;

        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(rotation);
        ctx.scale(verticalScale, horizontalScale);

        // Draw the items for the group we point to
        for (let i = 0; i < dispGroup.items.length; i++) {
            let dispItem = dispGroup.items[i];
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