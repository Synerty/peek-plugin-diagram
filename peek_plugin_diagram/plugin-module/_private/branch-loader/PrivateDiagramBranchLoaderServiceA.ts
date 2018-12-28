import {Injectable} from "@angular/core";
import {GridTuple} from "./GridTuple";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PrivateDiagramBranchLoaderStatusTuple} from "./PrivateDiagramBranchLoaderStatusTuple";


export abstract class PrivateDiagramBranchLoaderServiceA extends ComponentLifecycleEventEmitter {
    constructor() {
        super();

    }

    abstract isReady(): boolean;

    abstract isReadyObservable(): Observable<boolean>;

    abstract observable: Observable<GridTuple[]>;

    abstract statusObservable(): Observable<PrivateDiagramBranchLoaderStatusTuple> ;

    abstract status(): PrivateDiagramBranchLoaderStatusTuple ;

    abstract watchGrids(gridKeys: string[]): void;

    abstract loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
                       gridKeys: string[]): void;

}

