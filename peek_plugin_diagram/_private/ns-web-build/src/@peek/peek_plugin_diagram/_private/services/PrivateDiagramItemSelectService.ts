import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

export interface SelectedItemDetailsI {
    modelSetKey: string;
    coordSetKey: string;
    dispKey: string;
    dispData: {};
}

/** Item Select Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramItemSelectService {

    private itemSelectSubject = new Subject<SelectedItemDetailsI>();

    constructor() {

    }

    itemSelectObservable(): Observable<SelectedItemDetailsI> {
        return this.itemSelectSubject;
    }

    selectItem(details: SelectedItemDetailsI): void {
        this.itemSelectSubject.next(details);
    }

}