import {ServiceBridgeHandlerBase} from "./ServiceBridgeHandlerBase";

interface CallDataI {
    promId: number,
    data: any[]
}

interface ResultDataI {
    promId: number,
    action: string,
    result: any
}

/** Service Bridge Handler Promise Caller Side
 *
 * This side is notifying the other side that a callable has been called
 *
 * */
export class ServiceBridgeHandlerPromiseCallerSide extends ServiceBridgeHandlerBase {
    private promsById = {};
    private nextPromiseId = 1;

    constructor(key: string,
                encodeWithPayload: boolean = true) {
        super(key, encodeWithPayload, false);
    }

    protected dataReceived(receivedData: any): void {
        let args: ResultDataI = receivedData;
        this.promsById[args.promId][args.action](args.result);
        delete this.promsById[args.promId];
    }

    call(...data: any[]): Promise<any> {
        let promId = this.nextPromiseId++;

        return new Promise<string | null>((resolve, reject) => {
            this.promsById[promId] = {
                "resolve": resolve,
                "reject": reject
            };

            // Get some typing in here.
            let dataToSend: CallDataI = {
                promId: promId,
                data: data
            };
            this.sendData(dataToSend);
        });

    }
}


/** Service Bridge Handler Promise Callee Side
 *
 * This side is receiving notification from the other side
 * that a callable has been called
 *
 */
export class ServiceBridgeHandlerPromiseCalleeSide extends ServiceBridgeHandlerBase {

    constructor(key: string,
                encodeWithPayload: boolean,
                private  callableReturningPromise: any) {

        super(key, encodeWithPayload);

    }

    protected dataReceived(receivedData: any): void {
        let args: CallDataI = receivedData;
        this.handlePromise(
            this.callableReturningPromise.apply(null, args.data),
            args.promId
        );
    }

    private handlePromise(promise: Promise<any>, promId: number): void {
        if (promise == null || promise.then == null) {
            console.log(`ERROR, Callable for bridge ${this.key} didn't return a promise`);
        }

        promise
            .then((resultData) => this.resolveReject(resultData, promId, 'resolve'))
            .catch((e) => this.resolveReject(e.toString(), promId, 'reject'));
    }

    resolveReject(resultData: any, promId: number, action: string): void {
        // Get some typing in here.
        let dataToSend: ResultDataI = {
            promId: promId,
            action: action,
            result: resultData
        };
        this.sendData(dataToSend);
    }


}
