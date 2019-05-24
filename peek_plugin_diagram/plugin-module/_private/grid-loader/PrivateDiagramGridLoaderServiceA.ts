import {GridTuple} from "./GridTuple";
import {Observable} from "rxjs/Observable";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {PrivateDiagramGridLoaderStatusTuple} from "./PrivateDiagramGridLoaderStatusTuple";


export abstract class PrivateDiagramGridLoaderServiceA extends ComponentLifecycleEventEmitter {
    constructor() {
        super();

    }

    abstract isReady(): boolean;

    abstract isReadyObservable(): Observable<boolean>;

    abstract observable: Observable<GridTuple[]>;

    abstract statusObservable(): Observable<PrivateDiagramGridLoaderStatusTuple> ;

    abstract status(): PrivateDiagramGridLoaderStatusTuple ;

    abstract watchGrids(gridKeys: string[]): void;

    abstract loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
                       gridKeys: string[]): void;

}

