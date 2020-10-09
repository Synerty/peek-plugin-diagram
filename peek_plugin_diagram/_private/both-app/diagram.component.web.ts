import {Component, Input} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import { TitleService } from "@synerty/peek-plugin-base-js"
import {DiagramComponentBase} from "./diagram.component";

@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    styleUrls: ['diagram.component.web.scss'],
    moduleId: module.id
})
export class DiagramComponent extends DiagramComponentBase {
    @Input() modelSetKey;

    constructor(titleService: TitleService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService) {
        super(titleService, positionService, toolbarService);
    }
}
