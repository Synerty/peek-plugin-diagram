import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {NsWebDiagramComponent} from './ns-web-diagram.component';
import {PeekPluginDiagramModule} from "../peek_plugin_diagram/diagram.module.web";

import { BalloonMsgService } from "@synerty/peek-plugin-base-js"
import {
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {GridLoaderBridgeWeb} from "../service-bridge/GridLoaderBridgeWeb";
import {PrivateDiagramGridLoaderServiceA} from "../@peek/peek_plugin_diagram/_private/grid-loader/PrivateDiagramGridLoaderServiceA";

import { TitleService } from "@synerty/peek-plugin-base-js"
import {TupleStorageFactoryServiceBridgeWeb} from "./TupleStorageFactoryServiceBridgeWeb";
import {PrivateDiagramTupleServiceWeb} from "./PrivateDiagramTupleServiceWeb";
import {PrivateDiagramTupleService} from "../@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";

import {
    BranchLoaderServiceBridgeWeb,
    BranchServiceBridgeWeb
} from "../service-bridge/BranchLoaderServiceBridgeWeb";
import {PrivateDiagramBranchLoaderServiceA} from "../@peek/peek_plugin_diagram/_private/branch-loader";
import {
    DiagramBranchService,
    DiagramLookupService,
    DiagramPositionService
} from "../@peek/peek_plugin_diagram";
import {PositionServiceBridgeWeb} from "../service-bridge-web/PositionServiceBridge.web";
import {ItemPopupServiceBridgeWeb} from "../service-bridge-web/ItemPopupServiceBridge.web";
import {
    PrivateDiagramCoordSetService,
    PrivateDiagramItemSelectService
} from "../@peek/peek_plugin_diagram/_private/services";
import {DiagramCoordSetService} from "../@peek/peek_plugin_diagram/DiagramCoordSetService";
import {DiagramConfigService} from "../@peek/peek_plugin_diagram/DiagramConfigService";
import {PrivateDiagramConfigService} from "../@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";
import {DispGroupCache} from "../peek_plugin_diagram/cache/DispGroupCache.web";
import {PrivateDiagramBranchService} from "../@peek/peek_plugin_diagram/_private/branch";


export function titleServiceFactory() {
    return new TitleService([]);
}


@NgModule({
    declarations: [
        NsWebDiagramComponent
    ],
    imports: [
        BrowserModule,
        PeekPluginDiagramModule
    ],
    providers: [
        {
            provide: TupleStorageFactoryService,
            useClass: TupleStorageFactoryServiceBridgeWeb
        },
        {
            provide: PrivateDiagramTupleService,
            useClass: PrivateDiagramTupleServiceWeb
        },
        {
            provide: TitleService,
            useFactory: titleServiceFactory
        },
        {
            provide: PrivateDiagramGridLoaderServiceA,
            useClass: GridLoaderBridgeWeb
        },
        {
            provide: DiagramPositionService,
            useClass: PositionServiceBridgeWeb
        },
        {
            provide: DiagramBranchService,
            useClass: PrivateDiagramBranchService
        },
        {
            provide: DiagramConfigService,
            useClass: PrivateDiagramConfigService
        },
        {
            provide: PrivateDiagramBranchLoaderServiceA,
            useClass: BranchLoaderServiceBridgeWeb
        },
        PrivateDiagramItemSelectService,
        DiagramLookupService,
        PrivateDiagramCoordSetService,
        DispGroupCache,

        BalloonMsgService,

        // Vortex Services
        VortexStatusService,
        VortexService,

    ],
    bootstrap: [NsWebDiagramComponent]
})
export class NsWebDiagramModule {

    // Define root services
    constructor(
        private diagramLookupService: DiagramLookupService,
        private diagramCoordSetService: DiagramCoordSetService,
        private dispGroupCache: DispGroupCache) {
    }
}
