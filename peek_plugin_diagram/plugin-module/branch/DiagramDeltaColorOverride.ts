import {addBranchDeltaType, DiagramDeltaBase} from "./DiagramDeltaBase";
import {DispColor} from "../lookups";
import {DeltaColorOverride} from "../_private/branch/deltas/DeltaColorOverride";
import {DiagramLookupCache} from "../DiagramLookupCacheService";

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
    __link(lookupCache: DiagramLookupCache): void {
        let lineColorId = DeltaColorOverride.lineColor(this._jsonData);
        let fillColorId = DeltaColorOverride.fillColor(this._jsonData);
        let colorId = DeltaColorOverride.color(this._jsonData);

        if (lineColorId != null) this._lineColor = lookupCache.colorForId(lineColorId);
        if (fillColorId != null) this._fillColor = lookupCache.colorForId(fillColorId);
        if (colorId != null) this._color = lookupCache.colorForId(colorId);
    }

    /** The Disp Keys to color */
    get dispKeys(): string[] {
        return DeltaColorOverride.dispKeys(this._jsonData);
    }

    addDispKeys(dispKeys: string[]): void {
        DeltaColorOverride.addDispKeys(this._jsonData, dispKeys);
    }

    /** Set the Line Color apples to shape lines */
    set lineColor(value: DispColor | null) {
        this._lineColor = value;
        DeltaColorOverride.setLineColor(value == null ? null : value.id, this._jsonData);
    }

    /** The Line Color apples to shape lines */
    get lineColor(): DispColor | null {
        return this._lineColor;
    }

    /** Set the Fill Color apples to shape lines */
    set fillColor(value: DispColor | null) {
        this._fillColor = value;
        DeltaColorOverride.setFillColor(value == null ? null : value.id, this._jsonData);
    }

    /** The Fill Color applies to closed shapes */
    get fillColor(): DispColor | null {
        return this._fillColor;

    }

    /** Set the Color apples to shape lines */
    set color(value: DispColor | null) {
        this._color = value;
        DeltaColorOverride.setColor(value == null ? null : value.id, this._jsonData);
    }

    /** This color applies to texts */
    get color(): DispColor | null {
        return this._color;

    }


}
