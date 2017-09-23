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
export class PrivateDiagramPositionService extends DiagramPositionService {

    constructor() {
        super();

    }

    // This observable is for when the canvas updates the title
    private titleUpdatedSubject: Subject<string> = new Subject<string>();

    private positionInitialSubject: Subject<string> = new Subject<string>();
    private positionSubject: Subject<DiagramPositionI> = new Subject<DiagramPositionI>();
    private isReadySubject: Subject<boolean> = new Subject<boolean>();

    private coordSetKeySubject = new Subject<string>();

    positionInitial(coordSetKey: string): void {
        this.positionInitialSubject.next(coordSetKey);
        this.coordSetKeySubject.next(coordSetKey);
    }

    position(coordSetKey: string, x: number, y: number, zoom: number): void {
        this.positionSubject.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom
        });
        this.coordSetKeySubject.next(coordSetKey);
    }

    setReady(value:boolean) {
        this.isReadySubject.next(true);
    }

    setTitle(value:string) {
        this.titleUpdatedSubject.next(value);
    }

    isReadyObservable(): Observable<boolean> {
        return this.isReadySubject;
    }

    titleUpdatedObservable(): Observable<string> {
        return this.titleUpdatedSubject;
    }

    positionObservable(): Observable<DiagramPositionI> {
        return this.positionSubject;
    }

    coordSetKeyObservable(): Observable<string> {
        return this.coordSetKeySubject;
    }

}