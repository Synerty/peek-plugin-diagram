import {Injectable} from "@angular/core";
import {GridCache} from "./GridCache";
import {LinkedGrid} from "./LinkedGrid";
import {Subject} from "rxjs/Subject";
import {assert, dictKeysFromObject} from "../DiagramUtil";

/** Grid Observable
 *
 * This class keeps track of the different diagram models that are observing grid updates
 *
 * When a grid update comes in from the cache, this class will notify the relevent models.
 *
 */
@Injectable()
export class GridObservable {
    private subjectByCanvasId: { [canvasId: number]: Subject<LinkedGrid> } = {};
    private gridKeysByCanvasId: { [canvasId: number]: string[] } = {};
    private canvasIdsByGidKey: { [gridKey: string]: number[] } = {};

    constructor(private gridCache: GridCache) {

        // This is a global service, there is no point at which this will unsubscribe
        this.gridCache.observable.subscribe(
            (grid: LinkedGrid) => this.processGridUpdates(grid)
        );

    }

    isReady(): boolean {
        return this.gridCache.isReady();
    }

    /** Ubsubscribe Canvas.
     *
     * The canvas component must call this to tear down and release resources used
     * for it.
     */
    unsubscribeCanvas(canvasId: number): void {
        /* 1) Delete the Subject
         * 2) Update the data structures
         * 3) Notify the grid cache
         */
        delete this.gridKeysByCanvasId[canvasId];
        delete this.subjectByCanvasId[canvasId];
        this.updateGridCacheWatchedKeys();
    }

    observableForCanvas(canvasId: number): Subject<LinkedGrid> {
        // Each canvas should only request the subject once
        assert(!this.subjectByCanvasId.hasOwnProperty(canvasId),
            `Canvas ${canvasId} has already requested a subhect`);

        this.subjectByCanvasId[canvasId] = new Subject<LinkedGrid>();
        return this.subjectByCanvasId[canvasId];

    }

    updateDiagramWatchedGrids(canvasId: number, gridKeys: string[]): void {
        this.gridKeysByCanvasId[canvasId] = gridKeys;
        this.updateGridCacheWatchedKeys();
    }

    private processGridUpdates(grid: LinkedGrid) {
        // If we have nothing waiting for this grid, Just disregard it.
        if (!this.canvasIdsByGidKey.hasOwnProperty(grid.gridKey))
            return;

        // Notify the subjects for the cavases watching this grid key
        let canvasIds = this.canvasIdsByGidKey[grid.gridKey];
        for (let canvasId of canvasIds) {
            this.subjectByCanvasId[canvasId].next(grid);
        }

    }

    private updateGridCacheWatchedKeys() {
        this.gridCache.updateWatchedGrids(dictKeysFromObject(this.canvasIdsByGidKey));
    }

}