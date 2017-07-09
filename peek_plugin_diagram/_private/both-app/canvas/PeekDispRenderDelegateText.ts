import {PeekDispRefData} from "./PeekDispRefData";
import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC";

export class PeekDispRenderDelegateText extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    draw(dispText, ctx, zoom, pan) {

        // Give meaning to our short names
        let rotationRadian = dispText.r / 180.0 * Math.PI;

        let point = dispText.g[0]; // get details of point

        let fontStyle = dispText.textStyle;
        let fillColor = dispText.color;

        // Null colors are also not drawn
        fillColor = (fillColor && fillColor.color) ? fillColor : null;

        // TODO, Draw a box around the text, based on line style

        let fontSize = fontStyle.fontSize * fontStyle.scaleFactor;

        let font = fontSize + "px " + fontStyle.fontName + " "
            + (fontStyle.fontStyle || '');

        let lineHeight = pointToPixel(fontSize);

        let textAlign = null;
        if (dispText.ha == -1)
            textAlign = 'start';
        else if (dispText.ha == 0)
            textAlign = 'center';
        else if (dispText.ha == 1)
            textAlign = 'end';

        let textBaseline = null;
        if (dispText.va == -1)
            textBaseline = 'top';
        else if (dispText.va == 0)
            textBaseline = 'middle';
        else if (dispText.va == 1)
            textBaseline = 'bottom';

        // save state
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(rotationRadian); // Degrees to radians

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.font = font;

        if (!fontStyle.scalable) {
            let unscale = 1.0 / zoom;
            ctx.scale(unscale, unscale);
        }

        let lines = dispText.te.split("\n");
        for (let lineIndex = 0; lineIndex < lines.length; ++lineIndex) {
            let line = lines[lineIndex];
            let yOffset = lineHeight * lineIndex;

            if (fillColor) {
                ctx.fillStyle = fillColor.color;
                ctx.fillText(line, 0, yOffset);
            }

            //if (dispText.lineColor) {
            //    ctx.lineWidth = dispText.lineSize;
            //    ctx.strokeStyle = dispText.lineColor;
            //    ctx.strokeText(line, 0, yOffset);
            //}
        }

//    self._bounds.w = ctx.measureText(self.text).width;
//    self._bounds.h = lineHeight * lines.length;
//
        // restore to original state
        ctx.restore();
//
//    if (self.ha == -1)
//        self._bounds.x = left;
//    else if (self.ha == 0)
//        self._bounds.x = left - self._bounds.w / 2;
//    else if (self.ha == 1)
//        self._bounds.x = left - self._bounds.w;
//
//    if (self.va == -1)
//        self._bounds.y = top;
//    else if (self.va == 0)
//        self._bounds.y = top - self._bounds.h / 2;
//    else if (self.va == 1)
//        self._bounds.y = top - self._bounds.h;
    };

    drawSelected(dispText, ctx, zoom, pan) {
    };

    contains(dispText, x, y, margin) {
        return false;
    };

    withIn(dispText, x, y, w, h) {
        return false;
    };

    handles(dispText) {
        return [];
    };

    deltaMove(dispText, dx, dy) {
    };

    area(dispText) {
        let self = this;
        return 0;
    };

}