import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramSnapshotService} from "@peek/peek_plugin_diagram/DiagramSnapshotService";
import { TitleService } from "@synerty/peek-plugin-base-js"


@Component({
    selector: 'pl-diagram-print',
    templateUrl: 'print.component.web.html',
    styleUrls: ['print.component.web.scss'],
    moduleId: module.id
})
export class PrintComponent extends ComponentLifecycleEventEmitter
    implements OnInit {

    @Output('closePopup')
    closePopupEmitter = new EventEmitter();

    private footerClass = 'peek-footer';

    src: string | null;

    constructor(private titleService: TitleService,
                private snapshotService: DiagramSnapshotService) {
        super();

    }

    ngOnInit() {
        console.log("Opening Start Edit popup");
        this.snapshotService
            .snapshotDiagram()
            .then((src) => this.src = src)
            .catch((e) => `Failed to load branches ${e}`);

        this.titleService.setEnabled(false);
        $(this.footerClass).hide();
    }


    // --------------------
    //

    closePopup(): void {
        this.src = null;
        this.closePopupEmitter.emit();

        this.titleService.setEnabled(true);
        $(this.footerClass).show();
    }

}
