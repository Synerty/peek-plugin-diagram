import {Component, OnInit} from '@angular/core';
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

@Component({
    selector: 'ns-web-diagram',
    templateUrl: './ns-web-diagram.component.html'
})
export class NsWebDiagramComponent extends ComponentLifecycleEventEmitter implements OnInit {

    modelSetKey: string | null = null;

    constructor() {
        super();

    }

    ngOnInit() {
        // Setup the connection to the server, and the coord set.

        let vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (m, key, value) => vars[key] = value
        );

        this.modelSetKey = vars['modelSetKey'];

        if (this.modelSetKey == null || this.modelSetKey.length == 0) {
            alert("modelSetKey set is empty or null");
            throw new Error("modelSetKey set is empty or null");
        }

    }

}
