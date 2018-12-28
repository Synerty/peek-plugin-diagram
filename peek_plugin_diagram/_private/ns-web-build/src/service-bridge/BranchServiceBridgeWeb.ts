import {Injectable} from "@angular/core";
import {
    DiagramBranchService,
} from "@peek/peek_plugin_diagram/DiagramBranchService";

import {
    PrivateDiagramBranchService
} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramBranchService";

import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramBranchContext} from "@peek/peek_plugin_diagram";
import {PrivateDiagramBranchLoaderServiceA} from "@peek/peek_plugin_diagram/_private/branch-loader";

@Injectable()
export class BranchServiceBridgeWeb
    extends ComponentLifecycleEventEmitter
    implements DiagramBranchService {

    private iface: window["nsWebViewInterface"];

    private _startEditingObservable = new Subject<PrivateDiagramBranchContext>();
    private _stopEditingObservable = new Subject<void>();

    constructor(private branchLoader: PrivateDiagramBranchLoaderServiceA) {
        super();

        let privateService = new PrivateDiagramBranchService(branchLoader);

        // Listen for calls from the NS side
        this.iface.on(
            'BranchService.startEditing',
            (params: {}) => {
                console.log("WEB: Received startEditing event");
                let context = privateService.getOrCreateBranch(
                    params.modelSetKey,
                    params.coordSetKey,
                    params.branchKey,
                    params.location
                )
                this._startEditingObservable.next(context);
            }
        );

        // Listen for calls from the NS site
        this.iface.on(
            'BranchService.stopEditing',
            () => {
                console.log("WEB: Received stopEditing event");
                privateService.stopEditing();
            }
        );

        lifeCycleEvents.onDestroyEvent
            .subscribe(() => {
                this.iface.off('BranchService.startEditing');
                this.iface.off('BranchService.stopEditing');
            });

    }

    get startEditingObservable(): Observable<PrivateDiagramBranchContext> {
        return this._startEditingObservable;
    }

    get stopEditingObservable(): Observable<void> {
        return this._stopEditingObservable;
    }

}