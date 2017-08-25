import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util/index.web";
// Import the default route component
import {DiagramComponent} from "./diagram.component";
// Import the required classes from VortexJS
import {
    TupleActionPushNameService,
    TupleActionPushOfflineService,
    TupleActionPushService,
    TupleDataObservableNameService,
    TupleDataObserverService,
    TupleDataOfflineObserverService,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService
} from "@synerty/vortexjs";
// Import the names we need for the vortexjs integrations
import {
    diagramActionProcessorName,
    diagramFilt,
    diagramObservableName,
    diagramTupleOfflineServiceName
} from "@peek/peek_plugin_diagram/_private/PluginNames";
// Import global modules, for example, the canvas extensions.
import "./canvas/PeekCanvasExtensions";
// import {DisplayCanvasSplashScreen} from "./loading-splash/loading-splash.service";
import {DiagramClientTupleOfflineObservable} from "./DiagramClientTupleOfflineObservable";
import {GridCache} from "./cache/GridCache";
import {GridObservable} from "./cache/GridObservable";
import {LookupCache} from "./cache/LookupCache";
import {DispGroupCache} from "./cache/DispGroupCache";
import {CoordSetCache} from "./cache/CoordSetCache";
import {CanvasComponent} from "./canvas-component/canvas-component";

import {
    DiagramItemSelectPrivateService,
    DiagramToolbarPrivateService,
    DiagramPositionPrivateService
} from "@peek/peek_plugin_diagram/_private";


import {DiagramItemSelectService} from "@peek/peek_plugin_diagram/DiagramItemSelectService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";

export function tupleActionPushNameServiceFactory() {
    return new TupleActionPushNameService(
        diagramActionProcessorName, diagramFilt);
}

export function tupleDataObservableNameServiceFactory() {
    return new TupleDataObservableNameService(
        diagramObservableName, diagramFilt);
}

export function tupleOfflineStorageNameServiceFactory() {
    return new TupleOfflineStorageNameService(diagramTupleOfflineServiceName);
}

// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routs and then select the component to load.
@NgModule({
    imports: [
        CommonModule,
        ...PeekModuleFactory.FormsModules,
    ],
    exports: [
        DiagramComponent
    ],
    providers: [
        TupleActionPushOfflineService, TupleActionPushService, {
            provide: TupleActionPushNameService,
            useFactory: tupleActionPushNameServiceFactory
        },
        TupleOfflineStorageService, {
            provide: TupleOfflineStorageNameService,
            useFactory: tupleOfflineStorageNameServiceFactory
        },
        TupleDataObserverService, TupleDataOfflineObserverService, {
            provide: TupleDataObservableNameService,
            useFactory: tupleDataObservableNameServiceFactory
        },
        DiagramClientTupleOfflineObservable,
        // DisplayCanvasSplashScreen,
        GridCache,
        LookupCache,
        CoordSetCache,
        DispGroupCache,
        GridObservable,

        // Other plugin integration services
        {
            provide: DiagramPositionService,
            useClass: DiagramPositionPrivateService
        },
        {
            provide: DiagramItemSelectService,
            useClass: DiagramItemSelectPrivateService
        },
        {
            provide: DiagramToolbarService,
            useClass: DiagramToolbarPrivateService
        },

    ],
    declarations: [DiagramComponent, CanvasComponent]
})
export class PeekPluginDiagramModule {
}
