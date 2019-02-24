import {Component, OnInit} from "@angular/core";

import {diagramBaseUrl} from "@peek/peek_plugin_diagram/_private";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";




@Component({
    selector: 'pl-diagram-layer',
    templateUrl: 'layer.component.web.html',
    moduleId: module.id
})
export class LayerComponent extends ComponentLifecycleEventEmitter
    implements OnInit {


    constructor() {
        super();

    }

    ngOnInit() {


    }


}
