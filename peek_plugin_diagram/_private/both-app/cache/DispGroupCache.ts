import {Injectable} from "@angular/core";


/** Lookup Store
 *
 * This class is responsible for storing the lookup data from the server
 *
 */
@Injectable()
export class DispGroupCache {

    constructor() {

    }


    // This should return an array of disps.
    dispGroupForId(groupId: number): any[] {
        return [];

    }

}