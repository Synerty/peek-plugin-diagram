import {TupleSelector} from "@synerty/vortexjs";
import {dictKeysFromObject, dictValuesFromObject} from "../DiagramUtil";
import {DiagramClientTupleOfflineObservable} from "../DiagramClientTupleOfflineObservable";
import {DispLevel} from "../tuples/lookups/DispLevel";
import {DispLayer} from "../tuples/lookups/DispLayer";
import {DispColor} from "../tuples/lookups/DispColor";
import {DispTextStyle} from "../tuples/lookups/DispTextStyle";
import {DispLineStyle} from "../tuples/lookups/DispLineStyle";

/** Lookup Store
 *
 * This class is responsible for storing the lookup data from the server
 *
 */
export class LookupCache {
    private loadedCounter = {};
    private _lookupTargetCount = 5;

    private _levelsById = {};
    private _layersById = {};
    private _colorsById = {};
    private _textStyleById = {};
    private _lineStyleById = {};
    private _dispGroupById = {}; // NOT USED YET

    private _levelsByCoordSetIdOrderedByOrder = {};
    private _layersOrderedByOrder = [];

    private subscriptions = [];


    constructor(private clientTupleObservable: DiagramClientTupleOfflineObservable) {

        this._init();

    }

// ============================================================================
// Init

    isReady() {
        let loadedCount = dictKeysFromObject(this.loadedCounter).length;
        return (this._lookupTargetCount <= loadedCount);
    };

// ============================================================================
// Init

    shutdown() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    };

// ============================================================================
// Accessors for common lookup data

    private _init() {

        let sub = (lookupAttr, tupleName, callback = null) => {
            this.subscriptions.push(
                this.clientTupleObservable.subscribeToTupleSelector(
                    new TupleSelector(tupleName, {})
                ).subscribe((tuples: any[]) => {
                    this.loadedCounter[lookupAttr] = true;
                    this[lookupAttr] = {};

                    for (let i = 0; i < tuples.length; i++) {
                        let item = tuples[i];
                        this[lookupAttr][item.id] = item;
                    }

                    if (callback != null) {
                        callback();
                    }
                })
            );
        };

        sub("_levelsById", DispLevel.tupleName, () => this.createLevelsOrderedByOrder());
        sub("_layersById", DispLayer.tupleName, () => this.createLayersOrderedByOrder());
        sub("_colorsById", DispColor.tupleName, () => this._validateColors());
        sub("_textStyleById", DispTextStyle.tupleName);
        sub("_lineStyleById", DispLineStyle.tupleName);

    };


// ============================================================================
// Load Callbacks

    _validateColors() {


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

    };


// ============================================================================
// Accessors

    levelForId(levelId) {

        return this._levelsById[levelId];
    };

    layerForId(layerId) {

        return this._layersById[layerId];
    };

    colorForId(colorId) {

        return this._colorsById[colorId];
    };

    textStyleForId(textStyleId) {

        return this._textStyleById[textStyleId];
    };

    lineStyleForId(lineStyleId) {

        return this._lineStyleById[lineStyleId];
    };

    dispGroupForId(dispGroupId) {

        return this._dispGroupById[dispGroupId];
    };


    layersOrderedByOrder(): DispLayer[] {
        return this._layersOrderedByOrder;
    }

    levelsOrderedByOrder(coordSetId: number): DispLevel[] {
        let result = this._levelsByCoordSetIdOrderedByOrder[coordSetId];
        return result == null ? [] : result;
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


    linkDispLookups(disp) {

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


// ============================================================================
// Create manage model single instance

}
