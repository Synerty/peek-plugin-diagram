import {Injectable} from "@angular/core";
import {
    DiagramItemPopupContextI,
    DiagramItemPopupService
} from "../../DiagramItemPopupService";
import {PrivateDiagramItemSelectService} from "./PrivateDiagramItemSelectService";
import {Observable, Subject} from "rxjs";


@Injectable()
export class PrivateDiagramItemPopupService extends DiagramItemPopupService {

    private itemPopupSubject = new Subject<DiagramItemPopupContextI>();

    private popupShownSubject = new Subject<boolean>();

    constructor(private itemSelectService: PrivateDiagramItemSelectService) {
        super();

    }

    itemPopupObservable(): Observable<DiagramItemPopupContextI> {
        return this.itemPopupSubject;
    }

    popupShownObservable(): Observable<boolean> {
        return this.popupShownSubject;
    }

    emitPopupContext(context:DiagramItemPopupContextI) :void {
        this.itemPopupSubject.next(context);
    }

    setPopupShown(value:boolean):void {
        this.popupShownSubject.next(value);
    }

}