import {NgZone} from "@angular/core";
import {DiagramPositionService, PositionUpdatedI} from "@_peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramPositionI,
    PrivateDiagramPositionService
} from "@_peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {WebViewInterface} from 'nativescript-webview-interface';
import { NgLifeCycleEvents } from "@synerty/peek-plugin-base-js"
import {ServiceBridgeHandlerPromiseCalleeSide} from "../service-bridge-util/ServiceBridgeHandlerPromise";
import {ServiceBridgeHandlerObservableSide} from "../service-bridge-util/ServiceBridgeHandlerObservable";
import {
    ServiceBridgeHandlerCalleeSide,
    ServiceBridgeHandlerCallerSide
} from "../service-bridge-util/ServiceBridgeHandlerCall";


export class PositionServiceBridgeNs {

    private handlers = [];

    constructor(private lifeCycleEvents: NgLifeCycleEvents,
                private zone: NgZone,
                private service: DiagramPositionService,
                private iface: WebViewInterface) {

        let positionService = <PrivateDiagramPositionService> service;


        // positionSubject
        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'PositionServiceBridge.positionSubject',
            false,
            positionService.positionSubject,
            lifeCycleEvents
        ));

        // positionByCoordSetObservable
        this.handlers.push(new ServiceBridgeHandlerObservableSide(
            'PositionServiceBridge.positionByCoordSetObservable',
            false,
            positionService.positionByCoordSetObservable(),
            lifeCycleEvents
        ));

        // setReady
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'PositionServiceBridge.setReady',
            false,
            positionService.setReady
        ));

        // positionUpdated
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'PositionServiceBridge.positionUpdated',
            false,
            positionService.positionUpdated
        ));

        // setTitle
        this.handlers.push(new ServiceBridgeHandlerCalleeSide(
            'PositionServiceBridge.setTitle',
            false,
            positionService.setTitle
        ));


        for (let handler of this.handlers) {
            handler.start(iface);
        }

    }

}
