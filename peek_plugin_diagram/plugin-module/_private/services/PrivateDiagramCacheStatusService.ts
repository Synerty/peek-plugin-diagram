
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {Injectable} from "@angular/core";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

@Injectable()
export class PrivateDiagramCacheStatusService extends ComponentLifecycleEventEmitter {

    private _isCachingInProgressSubject = new Subject<boolean>();
    private _isCachingInProgress = false;

    private _cacheProgressSubject = new Subject<string>();

    constructor() {
        super();
    }

    get cacheProgressObservable(): Observable<string> {
        return this._cacheProgressSubject;
    }

    updateStatus(value: string): void {
        this._cacheProgressSubject.next(value);
    }

    updateInProgress(value: boolean): void {
        this._isCachingInProgress = value;
        this._isCachingInProgressSubject.next(value);
    }

    get cachingRunningObservable(): Observable<boolean> {
        return this._isCachingInProgressSubject;
    }

    get cachingRunning(): boolean {
        return this._isCachingInProgress;
    }

}