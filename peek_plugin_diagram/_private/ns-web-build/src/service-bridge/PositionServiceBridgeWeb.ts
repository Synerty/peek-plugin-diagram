import {
    DiagramPositionService,
    PositionUpdatedI
} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

@Injectable()
export class PositionServiceBridgeWeb extends ComponentLifecycleEventEmitter {

    private iface: window["nsWebViewInterface"];

    constructor() {
        super();

        // Listen for calls from the NS site
        this.iface.on(
            'positionSubject',
            (pos: DiagramPositionI) => {
                console.log("WEB: Received positionSubject event");
                service.position(pos.coordSetKey, pos.x, pos.y, pos.zoom, pos.highlightKey);
            }
        );

        // Listen for calls from the NS site
        this.iface.on(
            'positionByCoordSetObservable',
            (coordSetKey: string) => {
                console.log("WEB: Received positionByCoordSetObservable event");
                service.positionByCoordSet(coordSetKey);
            }
        );

        this.onDestroyEvent
            .subscribe(() => {
                this.iface.off('positionSubject');
                this.iface.off('positionByCoordSetObservable');
            });

    }

    setReady(value: boolean) {
        console.log(`WEB: Sending isReadySubject ${val}`);
        this.iface.emit("isReadySubject", val);
    }

    positionUpdated(pos: PositionUpdatedI): void {
        console.log(`WEB: Sending positionUpdated`);
        this.iface.emit("positionUpdated", val);
    }

    setTitle(value: string) {
        console.log(`WEB: Sending titleUpdatedSubject ${val}`);
        this.iface.emit("titleUpdatedSubject", val);
    }

}