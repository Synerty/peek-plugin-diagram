import {Component} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {DiagramItemPopupService} from "@peek/peek_plugin_diagram/DiagramItemPopupService";
import {DiagramToolbarService} from "@peek/peek_plugin_diagram/DiagramToolbarService";
import {PrivateDiagramItemSelectService} from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramItemSelectService";
import {TitleService} from "@synerty/peek-util";
import {DiagramComponentBase} from "./diagram.component";


@Component({
    selector: 'peek-plugin-diagram',
    templateUrl: 'diagram.component.web.html',
    styleUrls: ['diagram.component.web.scss'],
    moduleId: module.id
})
export class DiagramComponent extends DiagramComponentBase {




    constructor(titleService: TitleService,
                privateItemSelectService: PrivateDiagramItemSelectService,
                itemPopupService: DiagramItemPopupService,
                positionService: DiagramPositionService,
                toolbarService: DiagramToolbarService) {
        super(titleService, privateItemSelectService,
            itemPopupService, positionService, toolbarService);


    }

}
