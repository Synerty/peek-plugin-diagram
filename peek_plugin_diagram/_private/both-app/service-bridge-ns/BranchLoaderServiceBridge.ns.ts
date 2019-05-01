import {WebViewInterface} from 'nativescript-webview-interface';
import {
    ComponentLifecycleEventEmitter,
    Payload,
    TupleOfflineStorageService
} from "@synerty/vortexjs";
import {
    PrivateDiagramItemSelectService,
    SelectedItemDetailsI
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";

import {
    GridTuple,
    PrivateDiagramGridLoaderServiceA,
    PrivateDiagramGridLoaderStatusTuple
} from "@peek/peek_plugin_diagram/_private/grid-loader";

export class BranchLoaderServiceBridgeNs  {


    constructor(private lifeCycleEvents: ComponentLifecycleEventEmitter,
                private gridLoader: PrivateDiagramGridLoaderServiceA,
                private iface: WebViewInterface) {

        this.iface.on(
            'DiagramLoadBridge_loadGrids',
            (argObj: any) => {
                let args: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("NS: Received DiagramLoadBridge_loadGrids event");
                this.gridLoader.loadGrids(args.currentGridUpdateTimes, args.gridKeys);

            }
        );


        this.iface.on(
            'DiagramLoadBridge_watchGrids',
            (argObj: any) => {
                let gridKeys: any = new Payload().fromJsonDict(argObj).tuples;

                console.log("NS: Received DiagramLoadBridge_watchGrids event");
                this.gridLoader.watchGrids(gridKeys);

            }
        );


        this.iface.on(
            'DiagramLoadBridge_start',
            (argObj: any) => {
                console.log("NS: Received DiagramLoadBridge_start event");
                this.start();
            }
        );


        this.lifeCycleEvents.onDestroyEvent
            .subscribe(() => {
                // this.iface.off('DiagramLoadBridge_loadGrids');
                // this.iface.off('DiagramLoadBridge_watchGrids');
            });

    }

    private start():void{

        // If the vortex service comes back online, update the watch grids.
        this.gridLoader.observable
            .takeUntil(this.lifeCycleEvents.onDestroyEvent)
            .subscribe((grids:GridTuple[]) => {

                console.log("NS: Sending DiagramLoadBridge_observable event");
                this.iface.emit(
                    "DiagramLoadBridge_observable",
                    new Payload({}, grids).toJsonDict()
                );
            });

        // If the vortex service comes back online, update the watch grids.
        this.gridLoader.isReadyObservable()
            .takeUntil(this.lifeCycleEvents.onDestroyEvent)
            .subscribe((val:boolean) => {
                console.log("NS: Sending DiagramLoadBridge_isReadyObservable event");
                this.iface.emit("DiagramLoadBridge_isReadyObservable", val);
            });

        // If the vortex service comes back online, update the watch grids.
        this.gridLoader.statusObservable()
            .takeUntil(this.lifeCycleEvents.onDestroyEvent)
            .subscribe((val:PrivateDiagramGridLoaderStatusTuple) => {
                console.log("NS: Sending DiagramLoadBridge_statusObservable event");
                this.iface.emit("DiagramLoadBridge_statusObservable", new Payload({}, [val]).toJsonDict());
            });


        this.iface.emit("DiagramLoadBridge_isReadyObservable", this.gridLoader.isReady());

    }



}