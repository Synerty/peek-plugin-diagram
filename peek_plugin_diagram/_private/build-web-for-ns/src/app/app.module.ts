import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {DiagramModule} from "../peek_plugin_diagram/diagram.module.web";

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

export function titleServiceFactory() {
    return new TitleService([]);
}


@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        DiagramModule
    ],
    providers: [
        {provide: WebSqlFactoryService, useClass: WebSqlBrowserFactoryService},
        {provide: TupleStorageFactoryService, useClass: TupleStorageFactoryServiceWeb},
        {
            provide: TitleService,
            useFactory: titleServiceFactory
        },
        Ng2BalloonMsgService,

        // Vortex Services
        VortexStatusService,
        VortexService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
