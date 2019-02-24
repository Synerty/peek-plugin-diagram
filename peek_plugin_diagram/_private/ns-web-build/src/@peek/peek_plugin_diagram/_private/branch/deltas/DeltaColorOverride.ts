import {DeltaBase} from "./DeltaBase";

/** Diagram Delta Color Override Tuple
 *
 * This delta applies an override colour to a set of display keys
 *
 */
export class DeltaColorOverride extends DeltaBase {

    private static readonly __DISP_KEYS_NUM = 1;
    private static readonly __LINE_COLOR_NUM = 2;
    private static readonly __FILL_COLOR_NUM = 3;
    private static readonly __COLOR_NUM = 4;

    static dispKeys(deltaJson): string[] {
        return deltaJson[DeltaColorOverride.__DISP_KEYS_NUM];
    }

    static addDispKeys(deltaJson: any[], dispKeys: string[]): void {
        if (deltaJson[DeltaColorOverride.__DISP_KEYS_NUM] == null)
            deltaJson[DeltaColorOverride.__DISP_KEYS_NUM] = [];
        Array.prototype.push.apply(deltaJson[DeltaColorOverride.__DISP_KEYS_NUM], dispKeys);
    }

    // Line Color
    static setLineColor(value: number, deltaJson): void {
        deltaJson[DeltaColorOverride.__LINE_COLOR_NUM];
    }

    static lineColor(deltaJson): number {
        return deltaJson[DeltaColorOverride.__LINE_COLOR_NUM];
    }

    // Fill Color
    static setFillColor(value: number | null, deltaJson): void {
        deltaJson[DeltaColorOverride.__FILL_COLOR_NUM] = value;
    }

    static fillColor(deltaJson): number {
        return deltaJson[DeltaColorOverride.__FILL_COLOR_NUM];
    }

    // Color
    static setColor(value: number | null, deltaJson): void {
        deltaJson[DeltaColorOverride.__COLOR_NUM] = value;
    }

    static color(deltaJson): number {
        return deltaJson[DeltaColorOverride.__COLOR_NUM];
    }


}
