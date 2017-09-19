import {Injectable} from "@angular/core";
import {DiagramToolbarService, DiagramToolButtonI} from "../../DiagramToolbarService";

import {Observable, Subject} from "rxjs";

@Injectable()
export class DiagramToolbarPrivateService extends DiagramToolbarService {

    toolButtons: DiagramToolButtonI[] = [];

    private _toolButtonsUpdatedSubject = new Subject<DiagramToolButtonI[]>();


    constructor() {
        super();

    }

    toolButtonsUpdatedObservable(): Observable<DiagramToolButtonI[]> {
        return this._toolButtonsUpdatedSubject;
    }

    addToolButton(toolButton: DiagramToolButtonI) {
        this.toolButtons.push(toolButton);
        this._toolButtonsUpdatedSubject.next(this.toolButtons);
    }

}