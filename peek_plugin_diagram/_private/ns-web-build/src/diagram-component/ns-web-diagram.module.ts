import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {NsWebDiagramComponent} from './ns-web-diagram.component';
import {PeekPluginDiagramModule} from "../peek_plugin_diagram/diagram.module.web";

import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService,
    WebSqlFactoryService
} from "@synerty/vortexjs";

import {
    TupleStorageFactoryServiceWeb,
    WebSqlBrowserFactoryService
} from "@synerty/vortexjs/index-browser";

import {TitleService} from "@synerty/peek-util";
import {TupleStorageFactoryServiceBridgeWeb} from "./TupleStorageFactoryServiceBridgeWeb";

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
            provide: TitleService,
            useFactory: titleServiceFactory
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