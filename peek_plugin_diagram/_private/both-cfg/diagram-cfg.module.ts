import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {Routes} from "@angular/router";
// Import a small abstraction library to switch between nativescript and web
import {PeekModuleFactory} from "@synerty/peek-util/index.web";
// Import the default route component
import {DiagramCfgComponent} from "./diagram-cfg.component";
// Import global modules, for example, the canvas extensions.
import {GridLoader, GridLoaderA} from "peek_plugin_diagram/cache/GridLoader";

import {PrivateDiagramCacheStatusService,} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCacheStatusService";



// Define the child routes for this plugin
export const pluginRoutes: Routes = [
    // {
    //     path: 'showDiagram',
    //     component: DiagramCfgComponent
    // },
    {
        path: '',
        pathMatch: 'full',
        component: DiagramCfgComponent
    }

];

// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routs and then select the component to load.
@NgModule({
    imports: [
        CommonModule,
        PeekModuleFactory.RouterModule,
        PeekModuleFactory.RouterModule.forChild(pluginRoutes),
        ...PeekModuleFactory.FormsModules,
    ],
    exports: [],
    providers: [
        {
            provide: GridLoaderA,
            useClass: GridLoader
        }
    ],
    declarations: [DiagramCfgComponent]
})
export class DiagramCfgModule {
}