import {Component} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    TupleDataObserverService,
    TupleSelector
} from "@synerty/vortexjs";
import {diagramFilt, DiagramLoaderStatusTuple} from "@peek/peek_plugin_diagram/_private";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";


@Component({
    selector: 'pl-diagram-status',
    templateUrl: './status.component.html'
})
export class StatusComponent extends ComponentLifecycleEventEmitter {

    item: DiagramLoaderStatusTuple = new DiagramLoaderStatusTuple();

    constructor(private balloonMsg: Ng2BalloonMsgService,
                private tupleObserver: TupleDataObserverService) {
        super();

        let sub = this.tupleObserver.subscribeToTupleSelector(
            new TupleSelector(DiagramLoaderStatusTuple.tupleName, {})
        ).subscribe((tuples: DiagramLoaderStatusTuple[]) => {
            this.item = tuples[0];
        });
        this.onDestroyEvent.subscribe(() => sub.unsubscribe());

    }


}