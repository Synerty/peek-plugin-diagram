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
import {GridLoaderA} from "../peek_plugin_diagram/cache/GridLoader";

import {TitleService} from "@synerty/peek-util";
import {TupleStorageFactoryServiceBridgeWeb} from "./TupleStorageFactoryServiceBridgeWeb";
import {PrivateDiagramTupleServiceWeb} from "./PrivateDiagramTupleServiceWeb";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";

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
            provide: GridLoaderA,
            useClass: GridLoaderBridgeWeb
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
