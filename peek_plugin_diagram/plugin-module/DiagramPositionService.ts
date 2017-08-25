import {Injectable} from "@angular/core";

/** Diagram Position Service
 *
 * This service allows other plugins embedding the diagram to position the diagram.
 *
 */
export abstract class DiagramPositionService {
    constructor() {

    }

    /** Position
     *
     * @param coordSetKey: The key of the coordinate set to position.
     *                      If this doesn't match the current coord set, nothing will
     *                      happen.
     *
     * @param x: The X coordinate to position to.
     * @param y: The Y coordinate to position to.
     * @param zoom: The Zoom to set when positioning the diagram.
     */
    abstract position(coordSetKey: string, x: number, y: number, zoom: number): void ;

}