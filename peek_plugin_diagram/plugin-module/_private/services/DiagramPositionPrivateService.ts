import {Injectable} from "@angular/core";
import {DiagramPositionService} from "../../DiagramPositionService";
import {Observable, Subject} from "rxjs";


export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
}


@Injectable()
export class DiagramPositionPrivateService extends DiagramPositionService {

    constructor() {
        super();

    }

    // This observable is for when the canvas updates the title
    titleUpdatedSubject: Subject<string> = new Subject<string>();

    positionInitialSubject: Subject<string> = new Subject<string>();
    positionSubject: Subject<DiagramPositionI> = new Subject<DiagramPositionI>();
    isReadySubject: Subject<boolean> = new Subject<boolean>();

    positionInitial(coordSetKey: string): void {
        this.positionInitialSubject.next(coordSetKey);
    }

    position(coordSetKey: string, x: number, y: number, zoom: number): void {
        this.positionSubject.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom
        });
    }

    isReadyObservable(): Observable<boolean> {
        return this.isReadySubject;
    }

}