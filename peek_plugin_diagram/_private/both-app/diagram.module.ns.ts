import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NzIconModule } from "ng-zorro-antd/icon";
import { DiagramComponent } from "./diagram.component.ns";
import { HttpClientModule } from "@angular/common/http";

// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routes and then select the component to load.
@NgModule({
    imports: [CommonModule, FormsModule, NzIconModule, HttpClientModule],
    exports: [DiagramComponent],
    providers: [],
    declarations: [DiagramComponent],
})
export class PeekPluginDiagramModule {}
