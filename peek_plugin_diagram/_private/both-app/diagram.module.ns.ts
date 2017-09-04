import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";

// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util/index.ns";
// Import the default route component
import {DiagramComponent} from "../ns-app/diagram.component";

import {
    DiagramItemSelectPrivateService,
} from "@peek/peek_plugin_diagram/_private/services/DiagramItemSelectPrivateService";
import {
    DiagramItemPopupPrivateService,
} from "@peek/peek_plugin_diagram/_private/services/DiagramItemPopupPrivateService";

import {
    DiagramPositionPrivateService,
} from "@peek/peek_plugin_diagram/_private/services/DiagramPositionPrivateService";

import {
    DiagramToolbarPrivateService
} from "@peek/peek_plugin_diagram/_private/services/DiagramToolbarPrivateService";

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
import {PopupComponent} from "./popup-component/popup.component";
import {ToolbarComponent} from "./toolbar-component/toolbar.component";


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
            useClass: DiagramPositionPrivateService
        },
        {
            provide: DiagramItemPopupService,
            useClass: DiagramItemPopupPrivateService
        },
        {
            provide: DiagramToolbarService,
            useClass: DiagramToolbarPrivateService
        },
        DiagramItemSelectPrivateService

    ],
    declarations: [DiagramComponent, CanvasComponent, PopupComponent, ToolbarComponent]
})
export class PeekPluginDiagramModule {
}
