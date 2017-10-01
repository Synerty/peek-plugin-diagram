import {Injectable} from "@angular/core";
import {DiagramPositionService} from "../../DiagramPositionService";
import {Observable, Subject} from "rxjs";

import {
    LocationIndex,
    PrivateDiagramLocationIndexService
} from "./PrivateDiagramLocationIndexService";
import {DispKeyLocationTuple} from "../tuples/DispLocationTuple";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";


export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
}


export interface DiagramPositionByKeyI {
    modelSetKey: string;
    dispKey: string;
    coordSetKey: string | null;
}


@Injectable()
export class PrivateDiagramPositionService extends DiagramPositionService {

    constructor(private locationIndexFactoryService:PrivateDiagramLocationIndexService,
                private balloonMsg:Ng2BalloonMsgService) {
        super();

    }

    // This observable is for when the canvas updates the title
    private titleUpdatedSubject: Subject<string> = new Subject<string>();

    private positionByCoordSetSubject = new Subject<string>();
    private positionSubject= new Subject<DiagramPositionI>();
    private positionByKeySubject= new Subject<DiagramPositionByKeyI>();

    private isReadySubject = new Subject<boolean>();

    positionByCoordSet(coordSetKey: string): void {
        this.positionByCoordSetSubject.next(coordSetKey);
    }

    position(coordSetKey: string, x: number, y: number, zoom: number): void {
        this.positionSubject.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom
        });
    }

    positionByKey(modelSetKey: string,
                  dispKey: string,
                  coordSetKey: string | null): void {

        this.locationIndexFactoryService
            .indexForModelSetKey(modelSetKey)
            .then((locationIndex:LocationIndex) =>{
                locationIndex.getLocations(dispKey)
                    .then((dispKeyIndexes:DispKeyLocationTuple[]) => {

                        if (dispKeyIndexes.length == 0) {
                            this.balloonMsg.showError(
                                `Can not locate disply item ${dispKey} in model set ${modelSetKey}`
                            );
                        }

                        let dispKeyIndex = dispKeyIndexes[0];

                        this.positionSubject.next({
                            coordSetKey: dispKeyIndex.coordSetKey,
                            x: dispKeyIndex.x,
                            y: dispKeyIndex.y,
                            zoom: 2.0
                        });
                });
        });
    }


    canPositionByKey(modelSetKey: string, dispKey: string): Promise<boolean>  {
        let casted :any = null;
       casted = this.locationIndexFactoryService
            .indexForModelSetKey(modelSetKey)
            .then((locationIndex:LocationIndex) =>{
                return locationIndex.getLocations(dispKey)
                    .then((val:DispKeyLocationTuple[]) =>  val.length != 0);
        });
       return casted;
    }

    setReady(value: boolean) {
        this.isReadySubject.next(true);
    }

    setTitle(value: string) {
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

    positionByKeyObservable(): Observable<DiagramPositionByKeyI> {
        return this.positionByKeySubject;
    }

    positionByCoordSetObservable(): Observable<string> {
        return this.positionByCoordSetSubject;
    }

}