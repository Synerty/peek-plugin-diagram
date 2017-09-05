import {addTupleType, Tuple} from "@synerty/vortexjs";
import {diagramTuplePrefix} from "@peek/peek_plugin_diagram/_private";
import {ModelCoordSetGridSize} from "./ModelCoordSetGridSize";
import {assert} from "../../DiagramUtil";
import {PeekCanvasBounds} from "../../canvas/PeekCanvasBounds";


@addTupleType
export class ModelCoordSet extends Tuple {
    public static readonly tupleName = diagramTuplePrefix + "ModelCoordSet";

    id: number;
    key: string;
    name: string;
    initialPanX: number;
    initialPanY: number;
    initialZoom: number;
    enabled: boolean;

    comment: string;

    modelSetId: number;

    minZoom: number;
    maxZoom: number;

    gridSizes: ModelCoordSetGridSize[];

    constructor() {
        super(ModelCoordSet.tupleName)
    }


    /** Grid size for Zoom
     *
     * This method calculates which Z grid to use based on a zoom level
     */
    gridSizeForZoom(zoom: number): ModelCoordSetGridSize {
        assert(zoom != null, "Zoom can't be null");

        // Figure out the Z grid
        for (let gridSize of this.gridSizes) {
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
    gridKeysForArea(area: PeekCanvasBounds,
                    zoom: number): string[] {

        function trunc(num: any) {
            return parseInt(num);
        }

        let gridSize = this.gridSizeForZoom(zoom);

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
                gridKeys.push(this.id.toString() + "|" + gridSize.key + "." + x + 'x' + y);
            }
        }

        return gridKeys;
    }
}