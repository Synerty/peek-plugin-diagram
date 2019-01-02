import {Injectable} from "@angular/core";
import {BranchTuple} from "../branch/BranchTuple";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {BranchIndexLoaderStatusTuple} from "./BranchIndexLoaderStatusTuple";
import {DiagramBranchContext} from "../../branch/DiagramBranchContext";


export abstract class BranchIndexLoaderServiceA extends ComponentLifecycleEventEmitter {
    constructor() {
        super();

    }

    abstract isReady(): boolean;

    abstract isReadyObservable(): Observable<boolean>;

    // abstract observable: Observable<BranchTuple[]>;

    abstract statusObservable(): Observable<BranchIndexLoaderStatusTuple> ;

    abstract status(): BranchIndexLoaderStatusTuple ;

    // abstract watchGrids(gridKeys: string[]): void;
    //
    // abstract loadGrids(currentGridUpdateTimes: { [gridKey: string]: string },
    //                    gridKeys: string[]): void;

    abstract saveBranch(context:DiagramBranchContext):Promise<void>;


}

