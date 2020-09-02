import {Injectable} from "@angular/core";
import {
    DiagramPositionService,
    DispKeyLocation,
    OptionalPositionArgsI,
    PositionUpdatedI
} from "../../DiagramPositionService";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {DispKeyLocationTuple} from "../location-loader/DispKeyLocationTuple";
import { BalloonMsgService } from "@synerty/peek-plugin-base-js"
import {PrivateDiagramLocationLoaderService} from "../location-loader";
import {PrivateDiagramCoordSetService} from "./PrivateDiagramCoordSetService";


export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
    opts: OptionalPositionArgsI;
}


export interface DiagramPositionByKeyI {
    modelSetKey: string;
    coordSetKey: string | null;
    opts: OptionalPositionArgsI;
}


export interface DiagramPositionByCoordSetI {
    modelSetKey: string | null;
    coordSetKey: string | null;
}


@Injectable()
export class PrivateDiagramPositionService extends DiagramPositionService {

    constructor(private coordSetService: PrivateDiagramCoordSetService,
                private locationIndexService: PrivateDiagramLocationLoaderService,
                private balloonMsg: BalloonMsgService) {
        super();

    }

    // This observable is for when the canvas updates the title
    private titleUpdatedSubject: Subject<string> = new Subject<string>();

    private positionByCoordSetSubject = new Subject<DiagramPositionByCoordSetI>();
    private positionSubject = new Subject<DiagramPositionI>();
    private positionByKeySubject = new Subject<DiagramPositionByKeyI>();

    private isReadySubject = new Subject<boolean>();

    private postionUpdatedSubject = new Subject<PositionUpdatedI>();

    positionByCoordSet(modelSetKey: string, coordSetKey: string): void {
        this.positionByCoordSetSubject.next({modelSetKey, coordSetKey});
    }

    position(coordSetKey: string, x: number, y: number, zoom: number,
             opts: OptionalPositionArgsI = {}): void {
        this.positionSubject.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom,
            opts
        });
    }

    async positionByKey(modelSetKey: string,
                        coordSetKey: string | null,
                        opts: OptionalPositionArgsI = {}): Promise<void> {
        if (!this.coordSetService.isReady())
            throw new Error("positionByKey called before coordSetService is ready");

        if (opts.highlightKey == null || opts.highlightKey.length == 0)
            throw new Error("positionByKey must be passed opts.highlightKey");

        const dispKeyIndexes: DispKeyLocationTuple[] = await this.locationIndexService
            .getLocations(modelSetKey, opts.highlightKey);

        if (dispKeyIndexes.length == 0) {
            this.balloonMsg.showError(
                `Can not locate disply item ${opts.highlightKey}`
                + ` in model set ${modelSetKey}`
            );
        }

        for (let dispKeyIndex of dispKeyIndexes) {
            // If we've been given a coord set key
            // and it doesn't match the found item:
            if (coordSetKey != null && dispKeyIndex.coordSetKey != coordSetKey) {
                continue;
            }

            const coordSet = this.coordSetService
                .coordSetForKey(modelSetKey, dispKeyIndex.coordSetKey);

            if (coordSet == null)
                return;

            this.positionSubject.next({
                coordSetKey: dispKeyIndex.coordSetKey,
                x: dispKeyIndex.x,
                y: dispKeyIndex.y,
                zoom: coordSet.positionOnZoom,
                opts
            });
            return;
        }

        this.balloonMsg.showError(
            `Can not locate disply item ${opts.highlightKey}`
            + ` in model set ${modelSetKey}, in coord set ${coordSetKey}`
        );

    }

    async canPositionByKey(modelSetKey: string, dispKey: string): Promise<boolean> {
        const val: DispKeyLocationTuple[] = await this.locationIndexService
            .getLocations(modelSetKey, dispKey);
        return val.length != 0;
    }

    async locationsForKey(modelSetKey: string, dispKey: string): Promise<DispKeyLocation[]> {
        const tuples: DispKeyLocationTuple[] = await this.locationIndexService
            .getLocations(modelSetKey, dispKey);

        const locations = [];
        const locationByCoordSet = {};
        for (const tuple of tuples) {
            let location = locationByCoordSet[tuple.coordSetKey];
            if (location == null) {
                location = {
                    modelSetKey: modelSetKey,
                    coordSetKey: tuple.coordSetKey,
                    dispKey: dispKey,
                    positions: [],
                    zoom: 2.0
                };
                locationByCoordSet[tuple.coordSetKey] = location;
                locations.push(location);
            }
            location.positions.push({x: tuple.x, y: tuple.y});
        }
        return locations;
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

    positionByCoordSetObservable(): Observable<DiagramPositionByCoordSetI> {
        return this.positionByCoordSetSubject;
    }

}
