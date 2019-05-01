import {Payload} from "@synerty/vortexjs";


export abstract class ServiceBridgeHandlerBase {

    private iface = null;

    constructor(protected key: string,
                private encodeWithPayload: boolean,
                private enableListener: boolean = true) {


    }

    start(iface) {
        this.iface = iface;

        if (!this.enableListener)
            return;

        iface.on(
            this.key,
            (data: any) => {
                console.log(`Received ${this.key} event`);
                if (this.encodeWithPayload)
                    data = new Payload().fromJsonDict(data).tuples;
                this.dataReceived(data);
            }
        );

    }

    shutdown() {
        if (!this.enableListener)
            return;

        this.iface.off(this.key);
    }

    /** Data Received
     *
     * This medhod is called when data comes out of the Webview interface.
     *
     * @param data The decoded data
     */
    protected abstract dataReceived(data: any): void ;

    protected sendData(data: any): void {
        console.log(`Sending ${this.key} event`);
        if (this.encodeWithPayload)
            data = new Payload({}, data).toJsonDict();
        this.iface.emit(this.key, data);
    }


}
