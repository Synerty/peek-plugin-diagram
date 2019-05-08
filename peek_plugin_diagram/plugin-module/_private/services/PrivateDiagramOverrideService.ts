import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramOverrideService} from "../../DiagramOverrideService";
import {DiagramOverride} from "../../override/DiagramOverride";


/** Diagram Override Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramOverrideService extends DiagramOverrideService {

    private _applyOverrideSubject = new Subject<DiagramOverride>();
    private _revokeOverrideSubject = new Subject<DiagramOverride>();

    constructor() {
        super();

    }

    create(modelSetKey: string, coordSetKey: string): DiagramOverride {

        let override = new DiagramOverride();
        override["modelSetKey_"] = modelSetKey;
        override["coordSetKey_"] = coordSetKey;
        return override;
    }

    applyBranch(override: DiagramOverride): void {
        this._applyOverrideSubject.next(override);
    }

    get applyOverrideSubject(): Observable<DiagramOverride> {
        return this._applyOverrideSubject;
    }

    revokeBranch(override: DiagramOverride): void {
        this._revokeOverrideSubject.next(override);
    }

    get revokeOverrideSubject(): Observable<DiagramOverride> {
        return this._revokeOverrideSubject;
    }

}