import {Injectable} from "@angular/core";
import {
    DiagramItemPopupContextI,
    DiagramItemPopupService
} from "../../DiagramItemPopupService";
import {DiagramItemSelectPrivateService} from "./DiagramItemSelectPrivateService";
import {Observable, Subject} from "rxjs";


@Injectable()
export class DiagramItemPopupPrivateService extends DiagramItemPopupService {

    private _itemPopupSubject = new Subject<DiagramItemPopupContextI>();

    constructor(private itemSelectService: DiagramItemSelectPrivateService) {
        super();

    }

    itemPopupObserver(coordSetKey): Observable<DiagramItemPopupContextI> {
        return this._itemPopupSubject;
    }

}