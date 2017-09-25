import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";

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

import {
    diagramActionProcessorName,
    diagramFilt,
    diagramObservableName,
    diagramTupleOfflineServiceName
} from "@peek/peek_plugin_diagram/_private/PluginNames";

// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util/index.ns";
// Import the default route component
import {DiagramComponent} from "./diagram.component";

import {
    PrivateDiagramItemSelectService,
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {
    PrivateDiagramItemPopupService,
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemPopupService";

import {
    PrivateDiagramPositionService,
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";

import {
    PrivateDiagramToolbarService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramToolbarService";

import {
    DiagramItemPopupService,
} from "@peek/peek_plugin_diagram/DiagramItemPopupService";

import {
    DiagramPositionService,
} from "@peek/peek_plugin_diagram/DiagramPositionService";

import {
    DiagramToolbarService
} from "@peek/peek_plugin_diagram/DiagramToolbarService";

import {CanvasComponent} from "./canvas-component/canvas.component.ns";
import {PopupComponent} from "./popup-component/popup.component.ns";
import {ToolbarComponent} from "./toolbar-component/toolbar.component.ns";


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
    exports: [DiagramComponent],
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

        // Other plugin integration services
        {
            provide: DiagramPositionService,
            useClass: PrivateDiagramPositionService
        },
        PrivateDiagramItemSelectService

    ],
    declarations: [DiagramComponent, CanvasComponent, PopupComponent, ToolbarComponent]
})
export class PeekPluginDiagramModule {
}
