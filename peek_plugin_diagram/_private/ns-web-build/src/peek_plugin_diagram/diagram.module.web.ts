import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NzIconModule } from "ng-zorro-antd/icon";
import { HttpClientModule } from "@angular/common/http";
import {
    TupleActionPushOfflineSingletonService,
    TupleActionPushNameService,
    TupleActionPushOfflineService,
    TupleActionPushService,
    TupleDataObservableNameService,
    TupleDataObserverService,
    TupleDataOfflineObserverService,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService,
} from "@synerty/vortexjs";
import {
    diagramActionProcessorName,
    diagramFilt,
    diagramObservableName,
    diagramTupleOfflineServiceName,
} from "@peek/peek_plugin_diagram/_private/PluginNames";
import "./canvas/PeekCanvasExtensions.web";
import { GridCache } from "./cache/GridCache.web";
import { GridObservable } from "./cache/GridObservable.web";
import { LookupCache } from "./cache/LookupCache.web";
import { DispGroupCache } from "./cache/DispGroupCache.web";
import { CanvasComponent } from "./canvas-component/canvas-component.web";
import { PrivateDiagramItemSelectService } from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import { PrivateDiagramLocationLoaderService } from "@peek/peek_plugin_diagram/_private/location-loader";
import { PrivateDiagramPositionService } from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramPositionService";
import { PrivateDiagramCoordSetService } from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import { DiagramPositionService } from "@peek/peek_plugin_diagram/DiagramPositionService";
import { LayerComponent } from "./layer-component/layer.component.web";
import { GridLoaderBridgeWeb } from "../service-bridge/GridLoaderBridgeWeb";

@NgModule({
    imports: [CommonModule, FormsModule, NzIconModule, HttpClientModule],
    exports: [CanvasComponent],
    providers: [
        PrivateDiagramCoordSetService,
        GridCache,
        LookupCache,
        DispGroupCache,
        GridObservable,
        {
            provide: DiagramPositionService,
            useClass: PrivateDiagramPositionService,
        },
        PrivateDiagramItemSelectService,
        PrivateDiagramLocationLoaderService,
    ],
    declarations: [CanvasComponent, LayerComponent],
})
export class PeekPluginDiagramModule {}
