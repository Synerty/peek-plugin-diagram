import {Injectable} from "@angular/core";
import {
    DiagramItemPopupContextI,
    DiagramItemPopupService
} from "../../DiagramItemPopupService";
import {DiagramItemSelectPrivateService} from "./DiagramItemSelectPrivateService";
import {Observable, Subject} from "rxjs";


@Injectable()
export class DiagramItemPopupPrivateService extends DiagramItemPopupService {

    itemPopupSubject = new Subject<DiagramItemPopupContextI>();

    popupShownSubject = new Subject<boolean>();

    constructor(private itemSelectService: DiagramItemSelectPrivateService) {
        super();

    }

    itemPopupObservable(coordSetKey): Observable<DiagramItemPopupContextI> {
        return this.itemPopupSubject;
    }

    popupShownObservable(): Observable<boolean> {
        return this.popupShownSubject;
    }

}