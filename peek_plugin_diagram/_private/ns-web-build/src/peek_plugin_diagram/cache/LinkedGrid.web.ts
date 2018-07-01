import {assert} from "../DiagramUtil";
import {GridTuple} from "../tuples/GridTuple";
import {LookupCache} from "./LookupCache.web";
/** Linked Grid
 *
 * This class represents a constructed grid of data, ready for use by a canvas model
 *
 */
export class LinkedGrid {
    gridKey = null;
    lastUpdate = null;
    loadedFromServerDate = new Date();
    disps = [];

    constructor(serverCompiledGridOrGridKey: string | GridTuple,
                lookupStore: LookupCache | null = null) {

        // initialise for empty grid keys
        if (typeof serverCompiledGridOrGridKey === "string") {
            this.gridKey = serverCompiledGridOrGridKey;
            return;
        }

        let serverCompiledGrid = <GridTuple>serverCompiledGridOrGridKey;
        assert(lookupStore != null, "lookupStore can not be null");

        this.gridKey = serverCompiledGrid.gridKey;
        this.lastUpdate = serverCompiledGrid.lastUpdate;
        this.loadedFromServerDate = new Date();

        this.disps = [];
        let disps = [];

        if (serverCompiledGrid.dispJsonStr != null
            && serverCompiledGrid.dispJsonStr.length != 0) {
            try {
                disps = JSON.parse(serverCompiledGrid.dispJsonStr);
            } catch (e) {
                console.error(e.toString());
            }
        }

        // Resolve the lookups
        for (let j = 0; j < disps.length; j++) {
            let disp = disps[j];
            if (disp.id == null) {
                // This mitigates an old condition caused by the grid compiler
                // including dips that had not yet had json assigned.
                continue;
            }
            if (lookupStore.linkDispLookups(disp) != null) {
                this.disps.push(disp);
            }
        }
    }

    hasData() {
        return !(this.lastUpdate == null && this.disps.length == 0);
    }
}