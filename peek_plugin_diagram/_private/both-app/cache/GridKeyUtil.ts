
import {PeekCanvasBounds} from "../canvas/PeekCanvasBounds";
import {assert} from "../DiagramUtil";

export interface GridSizeI {
    min: number;
    max: number;
    key: number;
    xGrid: number;
    yGrid: number;
}
export interface GridSizesI {
    [id: string]: GridSizeI;
}

export let GRID_SIZES: GridSizesI = {
    0: {min: 0.0, max: 0.04, key: 0, xGrid: 30000, yGrid: 30000},
    1: {min: 0.04, max: 0.1, key: 1, xGrid: 10000, yGrid: 10000},
    2: {min: 0.1, max: 0.5, key: 2, xGrid: 2000, yGrid: 2000},
    3: {min: 0.5, max: 1000.0, key: 3, xGrid: 1000, yGrid: 1000},
};

// ============================================================================
// gridKey generation functions

/** Grid size for Zoom
 *
 * This method calculates which Z grid to use based on a zoom level
 */
export function gridSizeForZoom(zoom: number): GridSizeI {
    assert(zoom != null, "Zoom can't be null");

    // Figure out the Z grid
    for (let gridSizeKey in GRID_SIZES) {
        let gridSize = GRID_SIZES[gridSizeKey];
        if (gridSize.min <= zoom && zoom < gridSize.max) {
            return gridSize;
        }
    }
    throw new Error(`Unable to determine grid size for zoom ${zoom}`);
}

/** Grid Keys For Area
 *
 * This method returns the grids required for a certain area of a certain zoom level.
 *
 */
export function gridKeysForArea(coordSetId: number,
                                area: PeekCanvasBounds,
                                zoom: number): string[] {

    function trunc(num:any) {
        return parseInt(num);
    }

    let gridSize = gridSizeForZoom(zoom);

    // Round the X min/max
    let minGridX = trunc(area.x / gridSize.xGrid);
    let maxGridX = trunc((area.x + area.w) / gridSize.xGrid) + 1;

    // Round the Y min/max
    let minGridY = trunc(area.y / gridSize.yGrid);
    let maxGridY = trunc((area.y + area.h) / gridSize.yGrid) + 1;

    // Iterate through and create the grids.
    let gridKeys = [];
    for (let x = minGridX; x < maxGridX; x++) {
        for (let y = minGridY; y < maxGridY; y++) {
            gridKeys.push(coordSetId.toString() + "|" + gridSize.key + "." + x + 'x' + y);
        }
    }

    return gridKeys;
}
