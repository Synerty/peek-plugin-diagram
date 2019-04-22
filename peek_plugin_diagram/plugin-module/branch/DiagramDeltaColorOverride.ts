import {addBranchDeltaType, DiagramDeltaBase} from "./DiagramDeltaBase";
import {DispColor} from "../lookups";
import {DiagramLookupService} from "../DiagramLookupService";

/** Diagram Delta Color Override Tuple
 *
 * This delta applies an override colour to a set of display keys.
 * This is the publicly exposed class.
 *
 */
@addBranchDeltaType(DiagramDeltaBase.TYPE_COLOUR_OVERRIDE)
export class DiagramDeltaColorOverride extends DiagramDeltaBase {

    private _lineColor: DispColor | null = null;
    private _fillColor: DispColor | null = null;
    private _color: DispColor | null = null;

    private static readonly __DISP_KEYS_NUM = 1;
    private static readonly __LINE_COLOR_NUM = 2;
    private static readonly __FILL_COLOR_NUM = 3;
    private static readonly __COLOR_NUM = 4;


    constructor() {
        super(DiagramDeltaBase.TYPE_COLOUR_OVERRIDE);
    }

    /** Link
     *
     * A PRIVATE method that populates the lookup classes, for easy use by other plugins.
     *
     * @param lookupCache
     * @private
     */
    __linkDispLookups(lookupCache: DiagramLookupService): void {
        let lineColorId = this._jsonData[DiagramDeltaColorOverride.__LINE_COLOR_NUM];
        let fillColorId = this._jsonData[DiagramDeltaColorOverride.__FILL_COLOR_NUM];
        let colorId = this._jsonData[DiagramDeltaColorOverride.__COLOR_NUM];

        if (lineColorId != null) this._lineColor = lookupCache.colorForId(lineColorId);
        if (fillColorId != null) this._fillColor = lookupCache.colorForId(fillColorId);
        if (colorId != null) this._color = lookupCache.colorForId(colorId);
    }

    /** The Disp Keys to color */
    get dispKeys(): string[] {
        return this._jsonData[DiagramDeltaColorOverride.__DISP_KEYS_NUM];
    }

    addDispKeys(dispKeys: string[]): void {
        if (this._jsonData[DiagramDeltaColorOverride.__DISP_KEYS_NUM] == null)
            this._jsonData[DiagramDeltaColorOverride.__DISP_KEYS_NUM] = [];
        Array.prototype.push.apply(this._jsonData[DiagramDeltaColorOverride.__DISP_KEYS_NUM], dispKeys);
    }

    /** The Line Color apples to shape lines */
    get lineColor(): DispColor | null {
        return this._lineColor;
    }

    /** Set the Line Color apples to shape lines */
    set lineColor(value: DispColor | null ): void {
        this._lineColor = value;
        this._jsonData[DiagramDeltaColorOverride.__LINE_COLOR_NUM]
            = value == null ? null : value.id;
    }


    /** The Fill Color applies to closed shapes */
    get fillColor(): DispColor | null {
        return this._fillColor;
    }


    /** Set the Fill Color apples to shape lines */
    set fillColor(value: DispColor | null) {
        this._fillColor = value;
        this._jsonData[DiagramDeltaColorOverride.__FILL_COLOR_NUM]
            = value == null ? null : value.id;
    }

    /** Set the Color apples to shape lines */
    set color(value: DispColor | null) {
        this._color = value;
        this._jsonData[DiagramDeltaColorOverride.__COLOR_NUM]
            = value == null ? null : value.id;
    }

    /** This color applies to texts */
    get color(): DispColor | null {
        return this._color;

    }


}
