import {ServiceBridgeHandlerBase} from "./ServiceBridgeHandlerBase";


/** Service Bridge Handler Caller Side
 *
 * This side is notifying the other side that a callable has been called
 *
 * */
export class ServiceBridgeHandlerCallerSide extends ServiceBridgeHandlerBase {

    constructor(key: string,
                encodeWithPayload: boolean = true) {
        super(key, encodeWithPayload, false);
    }

    protected dataReceived(data: any): void {
        // We don't get any data
    }

    call(...data: any[]): void {
        this.sendData(data);
    }
}


/** Service Bridge Handler Callee Side
 *
 * This side is receiving notification from the other side
 * that a callable has been called
 *
 */
export class ServiceBridgeHandlerCalleeSide extends ServiceBridgeHandlerBase {

    constructor(key: string,
                encodeWithPayload: boolean,
                private  callable: any) {

        super(key, encodeWithPayload);

    }

    protected dataReceived(data: any[]): void {
        this.callable.apply(null, data);
    }


}
