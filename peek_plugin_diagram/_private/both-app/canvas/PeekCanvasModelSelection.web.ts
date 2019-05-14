import {PeekCanvasConfig} from "./PeekCanvasConfig.web";
import {DispBase} from "../tuples/shapes/DispBase";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PeekCanvasModel} from "./PeekCanvasModel.web";

// import 'rxjs/add/operator/takeUntil';

function now(): any {
    return new Date();
}


/**
 * Peek Canvas Model
 *
 * This class stores and manages the model of the NodeCoord and ConnCoord
 * objects that are within the viewable area.
 *
 */

export class PeekCanvasModelSelection {

    // The currently selected coords
    private _selection: {}[] = [];

    private _selectionChangedSubject = new Subject<{}[]>();

    private _keysToTryToSelect: string[] = [];

    constructor(private model: PeekCanvasModel,
                private config: PeekCanvasConfig) {


    };

// -------------------------------------------------------------------------------------
// reset
// -------------------------------------------------------------------------------------
    reset() {
        this._selection = [];
        this._keysToTryToSelect = [];
    };

    selectionChangedObservable(): Observable<{}[]> {
        return this._selectionChangedSubject;
    }

    selectedDisps(): any[] {
        return this._selection;
    }

    applyTryToSelect() {

        for (let key of this._keysToTryToSelect) {
            for (let disp of this.model.viewableDisps()) {
                if (DispBase.key(disp) == key) {
                    this._selection.add(disp); // Don't notify of item select
                    this._keysToTryToSelect.remove(key);
                    break;
                }
            }
        }

    }

    tryToSelectKeys(keys: string[]) {
        this._keysToTryToSelect = keys;
    }

    addSelection(objectOrArray) {
        this._selection = this._selection.add(objectOrArray);
        this.config.invalidate();
        if (!this.config.editor.active)
            this._selectionChangedSubject.next(this._selection);
    }

    removeSelection(objectOrArray) {
        this._selection = this._selection.remove(objectOrArray);
        this.config.invalidate();
        if (!this.config.editor.active)
            this._selectionChangedSubject.next(this._selection);
    }

    clearSelection() {
        this._selection = [];
        this.config.invalidate();
        if (!this.config.editor.active)
            this._selectionChangedSubject.next(this._selection);
    }


}