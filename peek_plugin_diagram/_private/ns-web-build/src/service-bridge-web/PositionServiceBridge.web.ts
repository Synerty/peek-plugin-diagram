import {
    DiagramPositionService,
    PositionUpdatedI
} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {DiagramPositionI} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {Injectable} from "@angular/core";
import {ServiceBridgeHandlerObserverSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerObservable";
import {ServiceBridgeHandlerCallerSide} from "../peek_plugin_diagram/service-bridge-util/ServiceBridgeHandlerCall";

@Injectable({
    providedIn: 'root'
})
export class PositionServiceBridgeWeb extends ComponentLifecycleEventEmitter {


    private handlers = [];

    private readonly positionSubjectHandler: ServiceBridgeHandlerObserverSide;
    private readonly positionByCoordSetSubjectHandler: ServiceBridgeHandlerObserverSide;

    private readonly setReadyHandler: ServiceBridgeHandlerCallerSide;
    private readonly positionUpdatedHandler: ServiceBridgeHandlerCallerSide;
    private readonly setTitleHandler: ServiceBridgeHandlerCallerSide;

    constructor(private service: DiagramPositionService) {
        super();
        let iface = window["nsWebViewInterface"];

        // positionSubject
        this.positionSubjectHandler = new ServiceBridgeHandlerObserverSide(
            'PositionServiceBridge.positionSubject',
            false
        );
        this.handlers.push(this.positionSubjectHandler);
        this.positionSubjectHandler.observable
            .takeUntil(this.onDestroyEvent)
            .subscribe((p: DiagramPositionI) => {
                this.service.position(p.coordSetKey, p.x, p.y, p.zoom, p.highlightKey);
            });

        // positionByCoordSetObservable
        this.positionByCoordSetSubjectHandler = new ServiceBridgeHandlerObserverSide(
            'PositionServiceBridge.positionByCoordSetObservable',
            false
        );
        this.handlers.push(this.positionByCoordSetSubjectHandler);
        this.positionByCoordSetSubjectHandler.observable
            .takeUntil(this.onDestroyEvent)
            .subscribe(service.positionByCoordSet);


        // setReady
        this.setReadyHandler = new ServiceBridgeHandlerCallerSide(
            'PositionServiceBridge.setReady',
            false,
        );
        this.handlers.push(this.setReadyHandler);


        // positionUpdated
        this.positionUpdatedHandler = new ServiceBridgeHandlerCallerSide(
            'PositionServiceBridge.positionUpdated',
            false,
        );
        this.handlers.push(this.positionUpdatedHandler);


        // setTitle
        this.setTitleHandler = new ServiceBridgeHandlerCallerSide(
            'PositionServiceBridge.setTitle',
            false,
        );
        this.handlers.push(this.setTitleHandler);


        for (let handler of this.handlers) {
            handler.start(iface);
        }

    }

    setReady(value: boolean) {
        this.setReadyHandler.call(value);
    }

    positionUpdated(pos: PositionUpdatedI): void {
        this.positionUpdatedHandler.call(pos);
    }

    setTitle(value: string) {
        this.setTitleHandler.call(value);
    }

}