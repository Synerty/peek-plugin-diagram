import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {EditSettingComponent} from "./edit-setting-table/edit.component";
import {
    TupleActionPushService,
    TupleDataObserverService,
    TupleActionPushNameService,
    TupleDataObservableNameService
} from "@synerty/vortexjs";
// Import our components
import {DiagramComponent} from "./diagram.component";
import {StatusComponent} from "./status/status.component";
import {
    diagramActionProcessorName,
    diagramFilt,
    diagramObservableName
} from "@peek/peek_plugin_diagram/_private";


export function tupleActionPushNameServiceFactory() {
    return new TupleActionPushNameService(
        diagramActionProcessorName, diagramFilt);
}

export function tupleDataObservableNameServiceFactory() {
    return new TupleDataObservableNameService(
        diagramObservableName, diagramFilt);
}

// Define the routes for this Angular module
export const pluginRoutes: Routes = [
    {
        path: '',
        component: DiagramComponent
    }

];

// Define the module
@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(pluginRoutes),
        FormsModule
    ],
    exports: [],
    providers: [
        TupleActionPushService, {
            provide: TupleActionPushNameService,
            useFactory: tupleActionPushNameServiceFactory
        },
        TupleDataObserverService, {
            provide: TupleDataObservableNameService,
            useFactory: tupleDataObservableNameServiceFactory
        }
    ],
    declarations: [DiagramComponent, StatusComponent, EditSettingComponent]
})
export class DiagramModule {

}
