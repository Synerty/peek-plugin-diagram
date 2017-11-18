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