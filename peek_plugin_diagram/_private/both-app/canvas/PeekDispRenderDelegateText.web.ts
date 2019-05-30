import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {PeekDispRenderDelegateABC} from "./PeekDispRenderDelegateABC.web";
import {
    DispText,
    DispTextT,
    TextHorizontalAlign,
    TextVerticalAlign
} from "../tuples/shapes/DispText";
import {pointToPixel} from "../DiagramUtil";
import {PeekCanvasBounds} from "./PeekCanvasBounds";
import {PointI} from "../tuples/shapes/DispBase";

export class PeekDispRenderDelegateText extends PeekDispRenderDelegateABC {

    constructor(config: PeekCanvasConfig) {
        super(config);

    }

    /** Draw
     *
     * NOTE: The way the text is scaled and drawn must match _calcTextSize(..)
     * in python module DispCompilerTask.py
     */
    draw(disp: DispTextT, ctx, zoom: number, pan: PointI, forEdit: boolean) {

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

        const centerX = DispText.centerPointX(disp);
        const centerY = DispText.centerPointY(disp);


        // save state
        ctx.save();
        ctx.translate(centerX, centerY);
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

        // Bounds can get serliased in branches, so check to see if it's actually the
        // class or just the restored object that it serialises to.
        if (disp.bounds == null || disp.bounds.contains == null)
            disp.bounds = new PeekCanvasBounds();
        disp.bounds.w = 0;


        let lines = DispText.text(disp).split("\n");
        for (let lineIndex = 0; lineIndex < lines.length; ++lineIndex) {
            let line = lines[lineIndex];
            let yOffset = lineHeight * lineIndex;

            // Measure the width
            let thisWidth = ctx.measureText(line).width / zoom;
            if (disp.bounds.w < thisWidth)
                disp.bounds.w = thisWidth;

            if (fillColor) {
                ctx.fillStyle = fillColor.color;
                ctx.fillText(line, 0, yOffset);
            }

            //if (disp.lineColor) {
            //    ctx.lineWidth = disp.lineSize;
            //    ctx.strokeStyle = disp.lineColor;
            //    ctx.strokeText(line, 0, yOffset);
            //}
        }

        let singleLineHeight = lineHeight / zoom;
        disp.bounds.h = singleLineHeight * lines.length;

        // restore to original state
        ctx.restore();

        if (horizontalAlignEnum == TextHorizontalAlign.left)
            disp.bounds.x = centerX;
        else if (horizontalAlignEnum == TextHorizontalAlign.center)
            disp.bounds.x = centerX - disp.bounds.w / 2;
        else if (horizontalAlignEnum == TextHorizontalAlign.right)
            disp.bounds.x = centerX - disp.bounds.w;

        if (verticalAlignEnum == TextVerticalAlign.top)
            disp.bounds.y = centerY;
        else if (verticalAlignEnum == TextVerticalAlign.center)
            disp.bounds.y = centerY - singleLineHeight / 2;
        else if (verticalAlignEnum == TextVerticalAlign.bottom)
            disp.bounds.y = centerY - singleLineHeight;
    };


    drawSelected(disp, ctx, zoom: number, pan: PointI, forEdit: boolean) {
        let bounds = disp.bounds;
        if (bounds == null)
            return;

        // DRAW THE SELECTED BOX
        let selectionConfig = this.config.renderer.selection;

        // Move the selection line a bit away from the object
        let offset = (selectionConfig.width + selectionConfig.lineGap) / zoom;

        let twiceOffset = 2 * offset;
        let x = bounds.x - offset;
        let y = bounds.y - offset;
        let w = bounds.w + twiceOffset;
        let h = bounds.h + twiceOffset;

        ctx.dashedRect(x, y, w, h, selectionConfig.dashLen / zoom);
        ctx.strokeStyle = selectionConfig.color;
        ctx.lineWidth = selectionConfig.width / zoom;
        ctx.stroke();

        /*
         // DRAW THE EDIT HANDLES
         ctx.fillStyle = CanvasRenderer.SELECTION_COLOR;
         let handles = this.handles();
         for (let i = 0; i < handles.length; ++i) {
         let handle = handles[i];
         ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
         }
         */
    };

    contains(disp: DispTextT, x, y, margin) {
        return disp.bounds == null ? false : disp.bounds.contains(x, y, margin);
    };

    withIn(disp: DispTextT, x, y, w, h): boolean {
        return disp.bounds == null ? false : disp.bounds.withIn(x, y, w, h);
    };

    handles(disp: DispTextT): PeekCanvasBounds[] {
        return [];
    };

    area(disp) {
        return disp.bounds == null ? 0 : disp.bounds.area();
    };

}