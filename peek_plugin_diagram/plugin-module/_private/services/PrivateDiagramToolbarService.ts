import {Injectable} from "@angular/core";
import {DiagramToolbarService, DiagramToolButtonI} from "../../DiagramToolbarService";

import {Observable, Subject} from "rxjs";

@Injectable()
export class PrivateDiagramToolbarService extends DiagramToolbarService {

    toolButtons: DiagramToolButtonI[] = [];

    private _toolButtonsUpdatedSubject = new Subject<DiagramToolButtonI[]>();

    private _exitDiagramCallable = {};

    constructor() {
        super();


        this.addToolButton(null,
                null,
                {
                    name: "Mockup",
                    tooltip: null,
                    icon: 'pencil',
                    callback: () => alert("Mockup feature is coming soon."),
                    children: []
                }
            );

        this.addToolButton(null,
                null,
                {
                    name: "Search",
                    tooltip: null,
                    icon: 'search',
                    callback: () => alert("Search feature is coming soon."),
                    children: []
                }
            );


        this.addToolButton(null,
                null,
                {
                    name: "WP Home",
                    tooltip: null,
                    icon: 'home',
                    callback: () => alert("This is an example web link"),
                    children: []
                }
            );
    }

    toolButtonsUpdatedObservable(): Observable<DiagramToolButtonI[]> {
        return this._toolButtonsUpdatedSubject;
    }

    addToolButton(modelSetKey: string | null,
                  coordSetKey: string | null,
                  toolButton: DiagramToolButtonI) {
        this.toolButtons.push(toolButton);
        this._toolButtonsUpdatedSubject.next(this.toolButtons);
    }

    exitDiagramCallable(modelSetKey: string): any | null {
        return this._exitDiagramCallable[modelSetKey];
    }

    setExitDiagramCallback(modelSetKey: string, callable: any): void {
        this._exitDiagramCallable[modelSetKey] = callable;
    }

}