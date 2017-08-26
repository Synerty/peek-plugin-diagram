import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";

export interface SelectedItemDetailsI {
    modelSetKey: string;
    coordSetKey: string;
    itemKey: string;
}

/** Item Select Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class DiagramItemSelectPrivateService {

    private _itemSelectSubject = new Subject<SelectedItemDetailsI>();

    constructor() {

    }

    itemSelectObserver(): Observable<SelectedItemDetailsI> {
        return this._itemSelectSubject;
    }

}