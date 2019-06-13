import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DiagramOverrideService} from "../../DiagramOverrideService";
import {DiagramOverrideBase} from "../../override/DiagramOverrideBase";


/** Diagram Override Service
 *
 * This service notifies the popup service that an item has been selected.
 *
 */
@Injectable()
export class PrivateDiagramOverrideService extends DiagramOverrideService {

    private overridesUpdatedSubject = new Subject<DiagramOverrideBase[]>();

    private appliedOverrides: { [key: string]: DiagramOverrideBase } = {};

    constructor() {
        super();

    }

    applyOverride(override: DiagramOverrideBase): void {
        this.appliedOverrides[override.key] = override;
        this.notifyOfUpdate();
    }

    revokeOverride(override: DiagramOverrideBase): void {
        delete this.appliedOverrides[override.key];
        this.notifyOfUpdate();
    }

    get overridesUpdatedObservable(): Observable<DiagramOverrideBase[]> {
        setTimeout(() => this.notifyOfUpdate(), 0);
        return this.overridesUpdatedSubject;
    }

    private notifyOfUpdate(): void {
        const overrides = [];
        for (const key of Object.keys(this.appliedOverrides)) {
            overrides.push(this.appliedOverrides[key]);
        }
        this.overridesUpdatedSubject.next(overrides);
    }

}