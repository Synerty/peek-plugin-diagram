import {Component, Input} from "@angular/core";
import {
    PrivateDiagramGridLoaderServiceA,
    PrivateDiagramGridLoaderStatusTuple
} from "@peek/peek_plugin_diagram/_private/grid-loader";
import {
    PrivateDiagramLocationLoaderService,
    PrivateDiagramLocationLoaderStatusTuple
} from "@peek/peek_plugin_diagram/_private/location-loader";

import {ComponentLifecycleEventEmitter, TupleSelector} from "@synerty/vortexjs";
import {OfflineConfigTuple} from "@peek/peek_plugin_diagram/_private/tuples";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services";


@Component({
    selector: 'peek-plugin-diagram-cfg',
    templateUrl: 'diagram-cfg.component.web.html',
    moduleId: module.id
})
export class DiagramCfgComponent extends ComponentLifecycleEventEmitter {

    gridLoaderStatus: PrivateDiagramGridLoaderStatusTuple = new PrivateDiagramGridLoaderStatusTuple();
    locationLoaderStatus: PrivateDiagramLocationLoaderStatusTuple = new PrivateDiagramLocationLoaderStatusTuple();

    offlineConfig: OfflineConfigTuple = new OfflineConfigTuple();

    private offlineTs = new TupleSelector(OfflineConfigTuple.tupleName, {});


    constructor(private gridLoader: PrivateDiagramGridLoaderServiceA,
                private locationLoader: PrivateDiagramLocationLoaderService,
                private tupleService: PrivateDiagramTupleService) {
        super();

        this.gridLoaderStatus = this.gridLoader.status();
        this.gridLoader.statusObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe(value => this.gridLoaderStatus = value);

        this.locationLoaderStatus = this.locationLoader.status();
        this.locationLoader.statusObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe(value => this.locationLoaderStatus = value);

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(this.offlineTs, false, false, true)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: OfflineConfigTuple[]) => {
                if (tuples.length == 0) {
                    this.tupleService.offlineObserver.updateOfflineState(
                        this.offlineTs, [this.offlineConfig]
                    );
                    return;
                }
            });

    }

    toggleOfflineMode(): void {
        this.offlineConfig.cacheChunksForOffline = !this.offlineConfig.cacheChunksForOffline;
        this.tupleService.offlineObserver.updateOfflineState(
            this.offlineTs, [this.offlineConfig]
        );
    }

}
