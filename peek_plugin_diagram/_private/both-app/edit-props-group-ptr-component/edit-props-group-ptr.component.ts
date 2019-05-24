import {Component, Input, OnInit} from "@angular/core";
import {ComponentLifecycleEventEmitter, Payload, TupleSelector} from "@synerty/vortexjs";
import {PeekCanvasEditor} from "../canvas/PeekCanvasEditor.web";
import {PrivateDiagramCoordSetService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramCoordSetService";
import {DiagramCoordSetService} from "@peek/peek_plugin_diagram/DiagramCoordSetService";
import {ModelCoordSet} from "@peek/peek_plugin_diagram/_private/tuples/ModelCoordSet";
import {GroupDispsTuple} from "@peek/peek_plugin_diagram/_private/tuples/GroupDispsTuple";
import {PrivateDiagramTupleService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramTupleService";
import {Subject} from "rxjs";
import {PrivateDiagramGridLoaderServiceA} from "@peek/peek_plugin_diagram/_private/grid-loader/PrivateDiagramGridLoaderServiceA";
import {GridTuple} from "@peek/peek_plugin_diagram/_private/grid-loader/GridTuple";
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";
import {LinkedGrid} from "../cache/LinkedGrid.web";
import {DispGroup, DispGroupT} from "../tuples/shapes/DispGroup";


@Component({
    selector: 'pl-diagram-edit-props-group-ptr',
    templateUrl: 'edit-props-group-ptr.component.html',
    styleUrls: ['edit-props-group-ptr.component.scss'],
    moduleId: module.id
})
export class EditPropsGroupPtrComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Input("canvasEditor")
    canvasEditor: PeekCanvasEditor;

    private coordSetCache: PrivateDiagramCoordSetService;

    templateCoordSets: ModelCoordSet[] = [];
    selectedCoordSetId: string = null;

    dispGroups: DispGroupT[] = [];
    selectedDispGroup = null;

    private unsubSubject = new Subject<void>();

    constructor(private tupleService: PrivateDiagramTupleService,
                abstractCoordSetCache: DiagramCoordSetService,
                private gridLoader: PrivateDiagramGridLoaderServiceA,
                private lookupService: DiagramLookupService) {
        super();
        this.coordSetCache = <PrivateDiagramCoordSetService>abstractCoordSetCache;

    }

    ngOnInit() {
        this.templateCoordSets = [];

        let coordSets = this.coordSetCache
            .coordSets(this.canvasEditor.branchContext.modelSetKey);

        for (let coordSet of coordSets) {
            if (coordSet.dispGroupTemplatesEnabled === true)
                this.templateCoordSets.push(coordSet);
        }
    }

    noDispGroups(): boolean {
        return this.dispGroups.length == 0;
    }

    isSelectedDispGroup(item: DispGroupT): boolean {
        return this.selectedDispGroup != null && item.id == this.selectedDispGroup.id;
    }

    selectedCoordSetIdChanged(num: string): void {
        let coordSetId = parseInt(num);

        let tupleSelector = new TupleSelector(GroupDispsTuple.tupleName, {
            "coordSetId": coordSetId
        });

        this.unsubSubject.next();

        this.tupleService.offlineObserver
            .subscribeToTupleSelector(tupleSelector)
            .takeUntil(this.unsubSubject)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: GroupDispsTuple[]) => {
                if (tuples.length == 0)
                    return;

                let gridDispTuple = tuples[0];

                if (gridDispTuple.encodedGridTuple == null)
                    return;

                Payload.fromEncodedPayload(gridDispTuple.encodedGridTuple)
                    .then((payload: Payload) => {
                        let gridTuple: GridTuple = payload.tuples[0];
                        let linkedGrid = new LinkedGrid(gridTuple, this.lookupService);
                        this.dispGroups = linkedGrid.disps;
                    })
                    .catch((err) => {
                        console.log(`GridLoader.emitEncodedGridTuples decode error: ${err}`);
                    });
            });
    }

    dispName(disp: DispGroupT): string {
        return DispGroup.groupName(disp);
    }

    toggleEnabled(disp: DispGroupT): void {
        //this.selectedDispGroup = disp;
        //this.canvasEditor.canvasInput["_delegate"]["HACK_setDispGroup"](this.selectedDispGroup)
    }


}
