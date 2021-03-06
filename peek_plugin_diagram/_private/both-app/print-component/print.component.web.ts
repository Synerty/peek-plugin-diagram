import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import { NgLifeCycleEvents } from "@synerty/peek-plugin-base-js"
import {DiagramSnapshotService} from "@peek/peek_plugin_diagram/DiagramSnapshotService";
import { HeaderService } from "@synerty/peek-plugin-base-js"


@Component({
    selector: 'pl-diagram-print',
    templateUrl: 'print.component.web.html',
    styleUrls: ['print.component.web.scss']
})
export class PrintComponent extends NgLifeCycleEvents
    implements OnInit {

    @Output('closePopup')
    closePopupEmitter = new EventEmitter();

    private footerClass = 'peek-footer';

    src: string | null;

    constructor(private headerService: HeaderService,
                private snapshotService: DiagramSnapshotService) {
        super();

    }

    ngOnInit() {
        console.log("Opening Start Edit popup");
        this.snapshotService
            .snapshotDiagram()
            .then((src) => this.src = src)
            .catch((e) => `Failed to load branches ${e}`);

        this.headerService.setEnabled(false);
        $(this.footerClass).hide();
    }


    // --------------------
    //

    closePopup(): void {
        this.src = null;
        this.closePopupEmitter.emit();

        this.headerService.setEnabled(true);
        $(this.footerClass).show();
    }

}
