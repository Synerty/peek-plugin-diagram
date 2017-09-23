import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";

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
