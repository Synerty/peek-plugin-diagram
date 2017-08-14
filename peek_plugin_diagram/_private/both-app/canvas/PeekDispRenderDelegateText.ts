import {PeekCanvasConfig} from "./PeekCanvasConfig";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC";
import {
    DispText,
    TextHorizontalAlign,
    TextVerticalAlign
} from "../tuples/shapes/DispText";
import {pointToPixel} from "../DiagramUtil";

export class PeekDispRenderDelegateText extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    /** Draw
     *
     * NOTE: The way the text is scaled and drawn must match _calcTextSize(..)
     * in python module DispCompilerTask.py
     */
    draw(disp, ctx, zoom, pan) {

        // Give meaning to our short names
        let rotationRadian = DispText.rotation(disp) / 180.0 * Math.PI;

        let fontStyle = DispText.textStyle(disp);
        let fillColor = DispText.color(disp);

        // Null colors are also not drawn
        fillColor = (fillColor && fillColor.color) ? fillColor : null;

        // TODO, Draw a box around the text, based on line style

        let horizontalStretchFactor = DispText.horizontalStretch(disp);
        let textHeight = DispText.height(disp);

        let fontSize = fontStyle.fontSize * fontStyle.scaleFactor;

        if (textHeight != null)
            fontSize = textHeight;

        let font = fontSize + "px " + fontStyle.fontName + " "
            + (fontStyle.fontStyle || '');


        let lineHeight = pointToPixel(fontSize);

        let textAlign = null;
        let horizontalAlignEnum = DispText.horizontalAlign(disp);
        if (horizontalAlignEnum == TextHorizontalAlign.left)
            textAlign = 'start';
        else if (horizontalAlignEnum == TextHorizontalAlign.center)
            textAlign = 'center';
        else if (horizontalAlignEnum == TextHorizontalAlign.right)
            textAlign = 'end';

        let textBaseline = null;
        let verticalAlignEnum = DispText.verticalAlign(disp);
        if (verticalAlignEnum == TextVerticalAlign.top)
            textBaseline = 'top';
        else if (verticalAlignEnum == TextVerticalAlign.center)
            textBaseline = 'middle';
        else if (verticalAlignEnum == TextVerticalAlign.bottom)
            textBaseline = 'bottom';


        // save state
        ctx.save();
        ctx.translate(DispText.centerPointX(disp), DispText.centerPointY(disp));
        ctx.rotate(rotationRadian); // Degrees to radians

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.font = font;

        if (!fontStyle.scalable) {
            let unscale = 1.0 / zoom;
            ctx.scale(unscale, unscale);
        }

        if (horizontalStretchFactor != 1) {
            ctx.scale(horizontalStretchFactor, 1);
        }


        let lines = DispText.text(disp).split("\n");
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
        return 0;
    };

}