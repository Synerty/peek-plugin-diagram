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

import {
    TupleStorageFactoryServiceWeb,
    WebSqlBrowserFactoryService
} from "@synerty/vortexjs/index-browser";
import {GridLoaderBridgeWeb} from "../service-bridge/GridLoaderBridgeWeb";
import {PrivateDiagramGridLoaderServiceA} from "../@peek/peek_plugin_diagram/_private/grid-loader/PrivateDiagramGridLoaderServiceA";

import {TitleService} from "@synerty/peek-util";
import {TupleStorageFactoryServiceBridgeWeb} from "./TupleStorageFactoryServiceBridgeWeb";
import {PrivateDiagramTupleServiceWeb} from "./PrivateDiagramTupleServiceWeb";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";

import {BranchLoaderServiceBridgeWeb} from "../service-bridge/BranchLoaderServiceBridgeWeb";
import {PrivateDiagramBranchLoaderServiceA} from "@peek/peek_plugin_diagram/_private/branch-loader";

import {BranchServiceBridgeWeb} from "../service-bridge/BranchLoaderServiceBridgeWeb";
import {DiagramBranchService} from "@peek/peek_plugin_diagram";


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
            provide: PrivateDiagramItemSelectService,
            useClass: ItemSelectServiceBridgeWeb
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
            provide: PrivateDiagramBranchLoaderServiceA,
            useClass: BranchLoaderServiceBridgeWeb
        },
        Ng2BalloonMsgService,

        // Vortex Services
        VortexStatusService,
        VortexService,

    ],
    bootstrap: [NsWebDiagramComponent]
})
export class NsWebDiagramModule {
}
