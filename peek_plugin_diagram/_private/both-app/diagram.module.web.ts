import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util-web";
// Import the default route component
import {DiagramComponent} from "./diagram.component.web";
// Import the required classes from VortexJS
// Import the names we need for the vortexjs integrations
// Import global modules, for example, the canvas extensions.
import "./canvas/PeekCanvasExtensions.web";
// import {DisplayCanvasSplashScreen} from "./loading-splash/loading-splash.service";
import {GridCache} from "./cache/GridCache.web";
import {GridObservable} from "./cache/GridObservable.web";
import {DispGroupCache} from "./cache/DispGroupCache.web";
import {CanvasComponent} from "./canvas-component/canvas-component.web";
import {PopupComponent} from "./popup-component/popup.component.mweb";
import {ToolbarComponent} from "./toolbar-component/toolbar.component.web";
import {EditContextComponent} from "./edit-context-component/edit-context.component.mweb";
import {EditToolbarComponent} from "./edit-toolbar-component/edit-toolbar.component.web";
import {EditShapePropertiesComponent} from "./edit-shape-properties-component/edit-shape-properties.component";
import {EditDynamicPropertiesComponent} from "./edit-dynamic-properties-component/edit-dynamic-properties.component";
import {SelectBranchesComponent} from "./select-branches-component/select-branches.component.web";
import {SelectLayersComponent} from "./select-layers-component/select-layers.component.web";
import {StartEditComponent} from "./start-edit-component/start-edit.component.web";


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
        GridCache,
        DispGroupCache,
        GridObservable
    ],
    declarations: [DiagramComponent, CanvasComponent, PopupComponent,
        ToolbarComponent,
        EditContextComponent, EditToolbarComponent,
        EditShapePropertiesComponent, EditDynamicPropertiesComponent,
        StartEditComponent, SelectLayersComponent, SelectBranchesComponent]
})
export class PeekPluginDiagramModule {
}
