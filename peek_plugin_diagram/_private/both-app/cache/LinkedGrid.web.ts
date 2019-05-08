import {assert} from "../DiagramUtil";
import {GridTuple} from "@peek/peek_plugin_diagram/_private/grid-loader/GridTuple";
import {BranchTuple} from "@peek/peek_plugin_diagram/_private/branch/BranchTuple";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";

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
    // TODO, Fix branch support
    branchDeltasByBranchKey: { [key: string]: any[] } = {};

    constructor(serverCompiledGridOrGridKey: string | GridTuple,
                lookupService: DiagramLookupService | null = null) {

        // initialise for empty grid keys
        if (typeof serverCompiledGridOrGridKey === "string") {
            this.gridKey = serverCompiledGridOrGridKey;
            return;
        }

        let serverCompiledGrid = <GridTuple>serverCompiledGridOrGridKey;
        assert(lookupService != null, "lookupStore can not be null");

        this.gridKey = serverCompiledGrid.gridKey;
        this.lastUpdate = serverCompiledGrid.lastUpdate;
        this.loadedFromServerDate = new Date();

        // Reconstruct the disps
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
            if (lookupService._linkDispLookups(disp) != null) {
                this.disps.push(disp);
            }
        }

        // Construct the branches
        this.branchDeltasByBranchKey = {};
        let branches = [];

        if (serverCompiledGrid.branchJsonStr != null
            && serverCompiledGrid.branchJsonStr.length != 0) {
            try {
                branches = JSON.parse(serverCompiledGrid.branchJsonStr);
            } catch (e) {
                console.error(e.toString());
            }
        }


        // Resolve the lookups for the branch deltas
        for (let branchJson of branches) {
            let branch: BranchTuple = BranchTuple.unpackJson(branchJson);
            branch.linkDisps(lookupService);
            // this.branchDeltasByBranchKey[branch.key] = branch.deltas(lookupService);
        }


    }

    hasData() {
        return !(this.lastUpdate == null && this.disps.length == 0);
    }
}