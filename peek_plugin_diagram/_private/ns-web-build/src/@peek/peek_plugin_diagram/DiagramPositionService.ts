import {Observable} from "rxjs/Observable";

export interface PositionUpdatedI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
}

/** Diagram Position Service
 *
 * This service allows other plugins embedding the diagram to position the diagram.
 *
 */
export abstract class DiagramPositionService {
    constructor() {

    }

    /** Position Initial
     *
     * Loads a coordSet and positions it at the default coordinates.
     *
     * @param coordSetKey; The key of the coordSet to position on.
     */
    abstract positionByCoordSet(coordSetKey: string): void ;

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

    /** Position By Key
     *
     * @param modelSetKey: The model set that the disp key belongs to
     * @param dispKey: The key of the display item.
     *
     * @param coordSetKey: Optionally, which coordSet to choose, otherwise if multitple
     *                      coord sets are present, the user will be asked.
     *
     */
    abstract positionByKey(modelSetKey: string, dispKey: string,
                           coordSetKey: string | null): void ;

    /** Can Position By Key
     *
     * @param modelSetKey: The model set that the disp key belongs to
     * @param dispKey: The key of the display item.
     *
     * @returns A promise that fires if the positon exists.
     *
     */
    abstract canPositionByKey(modelSetKey: string, dispKey: string): Promise<boolean> ;

    /** Position Updated Observable
     *
     * @return An observerable that fires when the canvas position is updated.
     */
    abstract positionUpdatedObservable(): Observable<PositionUpdatedI> ;

    /** isReady
     *
     * @returns an observable that is fired when the diagram loads a coordset
     * or the coord set changes
     */
    abstract isReadyObservable(): Observable<boolean> ;

}