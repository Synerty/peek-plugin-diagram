import {GridTuple} from "./GridTuple";
import {Observable} from "rxjs";
import { NgLifeCycleEvents } from "@synerty/peek-plugin-base-js"
import {PrivateDiagramGridLoaderStatusTuple} from "./PrivateDiagramGridLoaderStatusTuple";


export abstract class PrivateDiagramGridLoaderServiceA extends NgLifeCycleEvents {
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

