import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {NsWebDiagramComponent} from './ns-web-diagram.component';
import {PeekPluginDiagramModule} from "../peek_plugin_diagram/diagram.module.web";

import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";
import {GridLoaderBridgeWeb} from "../service-bridge/GridLoaderBridgeWeb";
import {PrivateDiagramGridLoaderServiceA} from "../@peek/peek_plugin_diagram/_private/grid-loader/PrivateDiagramGridLoaderServiceA";

import {TitleService} from "@synerty/peek-util";
import {TupleStorageFactoryServiceBridgeWeb} from "./TupleStorageFactoryServiceBridgeWeb";
import {PrivateDiagramTupleServiceWeb} from "./PrivateDiagramTupleServiceWeb";
import {PrivateDiagramTupleService} from "../@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";

import {
    BranchLoaderServiceBridgeWeb,
    BranchServiceBridgeWeb
} from "../service-bridge/BranchLoaderServiceBridgeWeb";
import {PrivateDiagramBranchLoaderServiceA} from "../@peek/peek_plugin_diagram/_private/branch-loader";
import {DiagramBranchService, DiagramPositionService} from "../@peek/peek_plugin_diagram";
import {PositionServiceBridgeWeb} from "../service-bridge-web/PositionServiceBridgeWeb";
import {ItemPopupServiceBridgeWeb} from "../service-bridge-web/ItemSelectServiceBridgeWeb";
import {
    PrivateDiagramItemPopupService,
    PrivateDiagramItemSelectService
} from "../@peek/peek_plugin_diagram/_private/services";
import {PrivateDiagramBranchService} from "../@peek/peek_plugin_diagram/_private/branch";
import {DiagramConfigService} from "../@peek/peek_plugin_diagram/DiagramConfigService";
import {PrivateDiagramConfigService} from "../@peek/peek_plugin_diagram/_private/services/PrivateDiagramConfigService";


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
            provide: PrivateDiagramItemPopupService,
            useClass: ItemPopupServiceBridgeWeb
        },
        {
            provide: DiagramPositionService,
            useClass: PositionServiceBridgeWeb
        },
        {
            provide: DiagramBranchService,
            useClass: BranchServiceBridgeWeb
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
        Ng2BalloonMsgService,

        // Vortex Services
        VortexStatusService,
        VortexService,

    ],
    bootstrap: [NsWebDiagramComponent]
})
export class NsWebDiagramModule {
}
