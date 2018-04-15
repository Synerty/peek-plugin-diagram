import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util-web";
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
import {GridLoader, GridLoaderA} from "./cache/GridLoader";
import {GridCache} from "./cache/GridCache.web";
import {GridObservable} from "./cache/GridObservable.web";
import {LookupCache} from "./cache/LookupCache.web";
import {DispGroupCache} from "./cache/DispGroupCache.web";
import {CanvasComponent} from "./canvas-component/canvas-component.web";


import {PrivateDiagramItemSelectService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {PrivateDiagramPositionService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import {PrivateDiagramToolbarService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";
import {PrivateDiagramItemPopupService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";
import {PrivateDiagramCoordSetService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";


import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PopupComponent} from "./popup-component/popup.component.mweb";
import {ToolbarComponent} from "./toolbar-component/toolbar.component.web";
import {LayerComponent} from "./layer-component/layer.component.web";



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
        {
            provide:GridLoaderA,
            useClass:GridLoader
        },
        GridCache,
        LookupCache,
        DispGroupCache,
        GridObservable
    ],
    declarations: [DiagramComponent, CanvasComponent, PopupComponent, ToolbarComponent, LayerComponent]
})
export class PeekPluginDiagramModule {
}
