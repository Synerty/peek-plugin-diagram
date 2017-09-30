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
import "./canvas/PeekCanvasExtensions.web";
// import {DisplayCanvasSplashScreen} from "./loading-splash/loading-splash.service";
import {DiagramClientTupleOfflineObservable} from "./DiagramClientTupleOfflineObservable.web";
import {GridCache} from "./cache/GridCache.web";
import {GridObservable} from "./cache/GridObservable.web";
import {LookupCache} from "./cache/LookupCache.web";
import {DispGroupCache} from "./cache/DispGroupCache.web";
import {CoordSetCache} from "./cache/CoordSetCache.web";
import {CanvasComponent} from "./canvas-component/canvas-component.web";


import {PrivateDiagramItemSelectService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {PrivateDiagramPositionService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {PrivateDiagramToolbarService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {PrivateDiagramItemPopupService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";


import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PopupComponent} from "./popup-component/popup.component.mweb";
import {ToolbarComponent} from "./toolbar-component/toolbar.component.web";
import {LayerComponent} from "./layer-component/layer.component.web";

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
        DiagramComponent,
        CanvasComponent
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
        GridCache,
        LookupCache,
        CoordSetCache,
        DispGroupCache,
        GridObservable,


    ],
    declarations: [DiagramComponent, CanvasComponent, PopupComponent, ToolbarComponent, LayerComponent]
})
export class PeekPluginDiagramModule {
}
