import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Observable, Subject} from "rxjs";
import {ServiceBridgeHandlerBase} from "./ServiceBridgeHandlerBase";


/** Service Bridge Handler Observable Side
 *
 * This side is notifying the other side when an observable on this side fires
 *
 * */
export class ServiceBridgeHandlerObservableSide extends ServiceBridgeHandlerBase {

    constructor(key: string,
                encodeWithPayload: boolean,
                observable: Observable<any>,
                lifeCycleEvents: ComponentLifecycleEventEmitter) {
        super(key, encodeWithPayload, false);

        observable
            .takeUntil(lifeCycleEvents.onDestroyEvent)
            .subscribe((data: any) => this.sendData(data));
    }

    protected dataReceived(data: any): void {
        // We don't get any data
    }

    /** Notify
     *
     * Use this when you want to manually notify the other end,
     * NOTE: Don't use sendData
     * @param data
     */
    notify(data: any) {
        this.sendData(data);
    }


}


/** Service Bridge Handler Observer Side
 *
 * This side is observing an observable defined in the other side
 * */
export class ServiceBridgeHandlerObserverSide extends ServiceBridgeHandlerBase {
    private _subject: Subject<any>  = new Subject<any>();

    private _lastData: any;

    constructor(key: string,
                encodeWithPayload: boolean = true,
                private  saveLastData: boolean = false,
                private lastDataDefault: any = null) {

        super(key, encodeWithPayload);
        this._lastData = lastDataDefault;

    }

    get observable(): Observable<any> {
        return this._subject;
    }

    get lastData(): any {
        return this._lastData;
    }

    protected dataReceived(data: any): void {
        if (this.saveLastData)
            this._lastData = data;
        this._subject.next(data);
    }


}
