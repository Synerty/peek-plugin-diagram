import {Injectable} from "@angular/core";
import {TupleDataOfflineObserverService, TupleSelector} from "@synerty/vortexjs";
import {DispColor, DispLayer, DispLevel, DispLineStyle, DispTextStyle} from "./lookups";
import {PrivateDiagramTupleService} from "./_private/services/PrivateDiagramTupleService";
import {Observable, Subject} from "rxjs";

let dictValuesFromObject = (dict) => Object.keys(dict).map(key => dict[key]);

/** Lookup Cache
 *
 * This class provides handy access to the lookup objects
 *
 * Typically there will be only a few hundred of these.
 *
 */
@Injectable()
export class DiagramLookupService {

    private loadedCounter = {};
    private _lookupTargetCount = 5;

    private _levelsById = {};
    private _layersById = {};
    private _colorsById = {};
    private _textStyleById = {};
    private _lineStyleById = {};

    private _levelsByCoordSetIdOrderedByOrder = {};
    private _layersOrderedByOrder = [];
    private _colorsOrderedByName = [];

    private subscriptions = [];

    private _isReady: boolean = false;
    private _isReadySubject: Subject<boolean> = new Subject<boolean>();


    constructor(private tupleService: PrivateDiagramTupleService) {

        let sub = (lookupAttr, tupleName, callback = null) => {
            let ts = new TupleSelector(tupleName, {});
            this.subscriptions.push(
                this.tupleService.offlineObserver.subscribeToTupleSelector(ts)
                    .subscribe((tuples: any[]) => {
                        if (!tuples.length)
                            return;

                        this.loadedCounter[lookupAttr] = true;
                        this[lookupAttr] = {};

                        for (let i = 0; i < tuples.length; i++) {
                            let item = tuples[i];
                            this[lookupAttr][item.id] = item;
                        }

                        if (callback != null) {
                            callback();
                        }

                        this._isReadySubject.next(this.isReady());
                    })
            );
        };

        sub("_levelsById", DispLevel.tupleName, () => this.createLevelsOrderedByOrder());
        sub("_layersById", DispLayer.tupleName, () => this.createLayersOrderedByOrder());
        sub("_colorsById", DispColor.tupleName, () => this._validateColors());
        sub("_textStyleById", DispTextStyle.tupleName);
        sub("_lineStyleById", DispLineStyle.tupleName, () => this._convertLineStyleDashPattern());
    };

    isReady(): boolean {
        // isReady is used in a doCheck loop, so make if fast once it's true
        if (this._isReady)
            return true;

        let loadedCount = Object.keys(this.loadedCounter).length;
        if (this._lookupTargetCount != loadedCount)
            return false;

        this._isReady = true;
        return true;
    };

    isReadyObservable(): Observable<boolean> {
        return this._isReadySubject;
    };

    shutdown() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    };

    // ============================================================================
    // Load Callbacks

    private _validateColors() {


        function validTextColor(stringToTest) {
            //Alter the following conditions according to your need.
            if (stringToTest === "") {
                return false;
            }
            if (stringToTest === "inherit") {
                return false;
            }
            if (stringToTest === "transparent") {
                return false;
            }

            let image = document.createElement("img");
            image.style.color = "rgb(0, 0, 0)";
            image.style.color = stringToTest;
            if (image.style.color !== "rgb(0, 0, 0)") {
                return true;
            }
            image.style.color = "rgb(255, 255, 255)";
            image.style.color = stringToTest;
            return image.style.color !== "rgb(255, 255, 255)";
        }

        let colors = dictValuesFromObject(this._colorsById);
        for (let i = 0; i < colors.length; i++) {
            let color = colors[i];
            if (!validTextColor(color.color)) {
                console.log("Color " + color.color + " is not a valid CSS color");
                color.color = "green";
            }
        }

        this._colorsOrderedByName = dictValuesFromObject(this._colorsById)
            .sort((o1, o2) => o1.name - o2.name);

    };


    // ============================================================================
    // Accessors

    levelForId(levelId: number): DispLevel {
        return this._levelsById[levelId];
    };

    layerForId(layerId: number): DispLayer {
        return this._layersById[layerId];
    };

    colorForId(colorId: number): DispColor {
        return this._colorsById[colorId];
    };

    textStyleForId(textStyleId: number): DispTextStyle {
        return this._textStyleById[textStyleId];
    };

    lineStyleForId(lineStyleId: number): DispLineStyle {
        return this._lineStyleById[lineStyleId];
    };


    layersOrderedByOrder(): DispLayer[] {
        return this._layersOrderedByOrder;
    }

    levelsOrderedByOrder(coordSetId: number): DispLevel[] {
        let result = this._levelsByCoordSetIdOrderedByOrder[coordSetId];
        return result == null ? [] : result;
    }

    colorsOrderedByName(): DispColor[] {
        return this._colorsOrderedByName;
    }

    private createLayersOrderedByOrder() {
        this._layersOrderedByOrder = dictValuesFromObject(this._layersById)
            .sort((o1, o2) => o1.order - o2.order);
    }

    private createLevelsOrderedByOrder() {
        let dict = {};
        this._levelsByCoordSetIdOrderedByOrder = dict;

        let ordered = dictValuesFromObject(this._levelsById)
            .sort((o1, o2) => o1.order - o2.order);

        for (let i = 0; i < ordered.length; i++) {
            let level = ordered[i];

            if (dict[level.coordSetId] == null)
                dict[level.coordSetId] = [];

            dict[level.coordSetId].push(level);
        }
    };

    /** Convert Line Style Dash Pattern
     *
     * This method converts the line style json into an array of numbers
     */
    private _convertLineStyleDashPattern() {
        let lineStyles: DispLineStyle[] = dictValuesFromObject(this._lineStyleById);
        for (let lineStyle of lineStyles) {
            if (lineStyle.dashPattern == null)
                continue;

            lineStyle.dashPatternParsed = JSON.parse('' + lineStyle.dashPattern);
        }
    }


    _linkDispLookups(disp) {

        if (disp.le != null) {
            disp.lel = this._levelsById[disp.le];
            if (disp.lel == null) return null;
        }

        if (disp.la != null) {
            disp.lal = this._layersById[disp.la];
            if (disp.lal == null) return null;
        }

        if (disp.fs != null) {
            disp.fsl = this._textStyleById[disp.fs];
            if (disp.fsl == null) return null;
        }

        if (disp.c != null) {
            disp.cl = this._colorsById[disp.c];
            if (disp.cl == null) return null;
        }

        if (disp.lc != null) {
            disp.lcl = this._colorsById[disp.lc];
            if (disp.lcl == null) return null;
        }

        if (disp.fc != null) {
            disp.fcl = this._colorsById[disp.fc];
            if (disp.fcl == null) return null;
        }

        if (disp.ls != null) {
            disp.lsl = this._lineStyleById[disp.ls];
            if (disp.lsl == null) return null;
        }

        return disp;
    };


}
