import {Injectable} from "@angular/core";


/** Lookup Store
 *
 * This class is responsible for storing the lookup data from the server
 *
 */
@Injectable()
export class DispGroupCache {

    private modelSetKey: string = "";

    constructor() {

    }

    setModelSetKey(modelSetKey: string) {
        this.modelSetKey = modelSetKey;
        // TODO, Load model set wide disp groups
    }


    // This should return an array of disps.
    dispGroupForId(groupId: number): any[] {
        return [];

    }

}
