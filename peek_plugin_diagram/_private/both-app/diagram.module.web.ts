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
import {CanvasComponent} from "./canvas-component/canvas-component.web";
import {ToolbarComponent} from "./view-toolbar-component/toolbar.component.web";
import {EditToolbarComponent} from "./edit-toolbar-component/edit-toolbar.component.web";
import {SelectBranchesComponent} from "./view-select-branches-component/select-branches.component.web";
import {SelectLayersComponent} from "./view-select-layers-component/select-layers.component.web";
import {StartEditComponent} from "./start-edit-component/start-edit.component.web";
import {BranchDetailComponent} from "./branch-detail-component/branch-detail.component.web";
import {EditPropsLivedbComponent} from "./edit-props-livedb-component/edit-props-livedb.component";
import {EditPropsShapeComponent} from "./edit-props-shape-component/edit-props-shape.component";
import {EditPropsComponent} from "./edit-props-component/edit-props.component.web";
import {EditPropsToolbarComponent} from "./edit-props-toolbar-component/edit-props-toolbar.component.web";
import {EditPropsGroupPtrComponent} from "./edit-props-group-ptr-component/edit-props-group-ptr.component";
import {PrintComponent} from "./print-component/print.component.web";
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzDescriptionsModule} from 'ng-zorro-antd/descriptions';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';


// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routs and then select the component to load.
@NgModule({
    imports: [
        CommonModule,
        ...PeekModuleFactory.FormsModules,
        NzDropDownModule,
        NzTabsModule,
        NzToolTipModule,
        NzButtonModule,
        NzTableModule,
        NzDescriptionsModule,
        NzModalModule,
        NzSwitchModule,
        NzPopconfirmModule
    ],
    exports: [
        DiagramComponent,
        CanvasComponent
    ],
    providers: [
        GridCache,
        GridObservable
    ],
    declarations: [DiagramComponent, CanvasComponent,
        ToolbarComponent,
        EditToolbarComponent,
        StartEditComponent, SelectLayersComponent, SelectBranchesComponent,
        BranchDetailComponent,
        EditPropsComponent, EditPropsLivedbComponent,
        EditPropsShapeComponent, EditPropsToolbarComponent,
        EditPropsGroupPtrComponent,
        PrintComponent]
})
export class PeekPluginDiagramModule {
}
