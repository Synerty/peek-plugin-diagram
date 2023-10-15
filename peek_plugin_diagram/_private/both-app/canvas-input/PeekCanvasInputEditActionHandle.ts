import { DispBaseT, PointI } from "../canvas-shapes/DispBase";
import { PeekCanvasBounds } from "@peek/peek_plugin_diagram/_private/PeekCanvasBounds";
import { InputDelegateConstructorViewArgs } from "./PeekCanvasInputDelegateUtil.web";

export enum EditActionDisplayTypeE {
    Tick,
    Pencil,
}

export enum EditActionDisplayPriorityE {
    Success,
    Default,
}

export class PeekCanvasInputEditActionHandle {
    constructor(
        private viewArgs: InputDelegateConstructorViewArgs,
        private point: PointI,
        private actionDisplayType: EditActionDisplayTypeE,
        private actionDisplayPriorityType: EditActionDisplayPriorityE = EditActionDisplayPriorityE.Success,
        public readonly shape: DispBaseT
    ) {
        if (this.point?.x == null || this.point?.y == null) {
            throw new Error(
                "PeekCanvasInputEditActionHandle: Point must have" +
                    " X and Y values."
            );
        }
    }

    get center(): PointI | null {
        return this.point;
    }

    get endLineCreateTickRadius(): number {
        return (
            this.viewArgs.config.editor.primaryEditActionHandleWidth /
            this.viewArgs.config.viewPort.zoom
        );
    }

    wasClickedOn(point: PointI): boolean {
        const radius = this.endLineCreateTickRadius;

        const handleBounds = new PeekCanvasBounds(
            this.point.x - radius,
            this.point.y - radius,
            radius * 2,
            radius * 2
        );
        return handleBounds.contains(point.x, point.y, 0);
    }

    draw(ctx) {
        switch (this.actionDisplayType) {
            case EditActionDisplayTypeE.Pencil: {
                this.drawPencil(ctx);
                break;
            }
            case EditActionDisplayTypeE.Tick: {
                this.drawTick(ctx);
                break;
            }
            default: {
                throw new Error(
                    `Unhandled ActionDisplayTypeE ${this.actionDisplayType}`
                );
            }
        }
    }

    private get color(): string {
        switch (this.actionDisplayPriorityType) {
            case EditActionDisplayPriorityE.Success: {
                return this.viewArgs.config.editor
                    .primaryEditActionCompleteColor;
            }
            case EditActionDisplayPriorityE.Default: {
                return this.viewArgs.config.editor
                    .primaryEditActionDefaultColor;
            }
            default: {
                throw new Error(
                    `Unhandled ActionDisplayTypeE ${this.actionDisplayType}`
                );
            }
        }
    }

    private drawTick(ctx): void {
        const x = this.point.x;
        const y = this.point.y;
        const radius = this.endLineCreateTickRadius;
        const zoom = this.viewArgs.config.viewPort.zoom;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(x - radius / 2, y + radius / 10);
        ctx.lineTo(x - radius / 10, y + radius / 2);
        ctx.lineTo(x + radius / 2, y - radius / 2);
        ctx.lineWidth = 4 / zoom;
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.closePath();
    }

    private drawPencil(ctx) {
        const x = this.point.x;
        const y = this.point.y;
        const radius = this.endLineCreateTickRadius;
        const zoom = this.viewArgs.config.viewPort.zoom;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.rect(
            x - radius / 10,
            y - radius / 2 - radius / 10,
            radius / 5,
            (radius / 2) * 2
        );
        ctx.rect(
            x - radius / 10,
            y - radius / 2 - radius / 10,
            radius / 5,
            radius / 10
        );
        ctx.moveTo(x - radius / 10, y + radius / 2 - radius / 10);
        ctx.lineTo(x, y + radius / 2 + radius / 8);
        ctx.lineTo(x + radius / 10, y + radius / 2 - radius / 10);
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.closePath();
    }
}
