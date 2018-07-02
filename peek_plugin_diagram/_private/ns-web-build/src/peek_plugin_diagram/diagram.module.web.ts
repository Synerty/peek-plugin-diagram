import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util-web";
// Import the required classes from VortexJS
import {
    TupleActionPushOfflineSingletonService,
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
import "./canvas/PeekCanvasExtensions.web";
import {GridCache} from "./cache/GridCache.web";
import {GridObservable} from "./cache/GridObservable.web";
import {LookupCache} from "./cache/LookupCache.web";
import {DispGroupCache} from "./cache/DispGroupCache.web";
import {CanvasComponent} from "./canvas-component/canvas-component.web";


import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {PrivateDiagramLocationLoaderService} from "@peek/peek_plugin_diagram/_private/location-loader";
import {PrivateDiagramPositionService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {LayerComponent} from "./layer-component/layer.component.web";
import {GridLoaderBridgeWeb} from "../service-bridge/GridLoaderBridgeWeb";


// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routs and then select the component to load.
@NgModule({
    imports: [
        CommonModule,
        ...PeekModuleFactory.FormsModules,
    ],
    exports: [
        CanvasComponent
    ],
    providers: [
        PrivateDiagramCoordSetService,
        GridCache,
        LookupCache,
        DispGroupCache,
        GridObservable,

        // Other plugin integration services
        {
            provide: DiagramPositionService,
            useClass: PrivateDiagramPositionService
        },
        PrivateDiagramItemSelectService,
        PrivateDiagramLocationLoaderService,

    ],
    declarations: [CanvasComponent, LayerComponent]
})
export class PeekPluginDiagramModule {
}
