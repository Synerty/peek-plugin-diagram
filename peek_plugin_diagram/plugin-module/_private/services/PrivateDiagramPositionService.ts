import {Injectable} from "@angular/core";
import {DiagramPositionService, PositionUpdatedI} from "../../DiagramPositionService";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {DispKeyLocationTuple} from "../location-loader/DispKeyLocationTuple";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {PrivateDiagramLocationLoaderService} from "../location-loader";


export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
    highlightKey: string | null;
}


export interface DiagramPositionByKeyI {
    modelSetKey: string;
    dispKey: string;
    coordSetKey: string | null;
}


@Injectable()
export class PrivateDiagramPositionService extends DiagramPositionService {

    constructor(private locationIndexService: PrivateDiagramLocationLoaderService,
                private balloonMsg: Ng2BalloonMsgService) {
        super();

    }

    // This observable is for when the canvas updates the title
    private titleUpdatedSubject: Subject<string> = new Subject<string>();

    private positionByCoordSetSubject = new Subject<string>();
    private positionSubject = new Subject<DiagramPositionI>();
    private positionByKeySubject = new Subject<DiagramPositionByKeyI>();

    private isReadySubject = new Subject<boolean>();

    private postionUpdatedSubject = new Subject<PositionUpdatedI>();

    positionByCoordSet(coordSetKey: string): void {
        this.positionByCoordSetSubject.next(coordSetKey);
    }

    position(coordSetKey: string, x: number, y: number, zoom: number): void {
        this.positionSubject.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom,
            highlightKey: null
        });
    }

    positionByKey(modelSetKey: string,
                  dispKey: string,
                  coordSetKey: string | null): void {

        this.locationIndexService
            .getLocations(modelSetKey, dispKey)
            .then((dispKeyIndexes: DispKeyLocationTuple[]) => {

                if (dispKeyIndexes.length == 0) {
                    this.balloonMsg.showError(
                        `Can not locate disply item ${dispKey} in model set ${modelSetKey}`
                    );
                }

                for (let dispKeyIndex of dispKeyIndexes) {
                    // If we've been given a coord set key and it doesn't match the found item:
                    if (coordSetKey != null && dispKeyIndex.coordSetKey != coordSetKey) {
                        continue;
                    }

                    this.positionSubject.next({
                        coordSetKey: dispKeyIndex.coordSetKey,
                        x: dispKeyIndex.x,
                        y: dispKeyIndex.y,
                        zoom: 2.0,
                        highlightKey: dispKey
                    });
                    return;
                }

                this.balloonMsg.showError(
                    `Can not locate disply item ${dispKey} in model set ${modelSetKey}, in coord set ${coordSetKey}`
                );

            });
    }


    canPositionByKey(modelSetKey: string, dispKey: string): Promise<boolean> {
        let casted: any = null;
        casted = this.locationIndexService
            .getLocations(modelSetKey, dispKey)
            .then((val: DispKeyLocationTuple[]) => val.length != 0);
        return casted;
    }

    setReady(value: boolean) {
        this.isReadySubject.next(true);
    }

    setTitle(value: string) {
        this.titleUpdatedSubject.next(value);
    }

    positionUpdated(pos: PositionUpdatedI): void {
        this.postionUpdatedSubject.next(pos);
    }

    isReadyObservable(): Observable<boolean> {
        return this.isReadySubject;
    }

    positionUpdatedObservable(): Observable<PositionUpdatedI> {
        return this.postionUpdatedSubject;
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