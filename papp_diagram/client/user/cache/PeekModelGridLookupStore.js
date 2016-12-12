/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';


/** Peek Model Grid Lookup Store
 *
 * This class is responsible for storing the lookup data from the server
 *
 */
define('PeekModelGridLookupStore', [
            // Named Dependencies
            "PayloadEndpoint", "Payload",
            // Unnamed Dependencies
            "Vortex", "jquery"
        ],
        function (PayloadEndpoint, Payload) {
            function PeekModelGridLookupStore() {
                var self = this;

                self._lookupLoadCount = 0;
                self._lookupTargetCount = 5;

                self._levelsById = {};
                self._layersById = {};
                self._colorsById = {};
                self._textStyleById = {};
                self._lineStyleById = {};

                self._levelsByCoordSetIdOrderedByOrder = null;
                self._layersOrderedByOrder = null;

                // // Display Groups are reusable, they are referred to by DispGroupPtrs
                // // Presently they have no dynamics
                //
                // self._lookupTargetCount++;
                // self._dispGroupById = {};

                self._init();


            }

// ============================================================================
// Init

            PeekModelGridLookupStore.prototype.isReady = function () {
                var self = this;
                return (self._lookupTargetCount <= self._lookupLoadCount);
            };

// ============================================================================
// Accessors for common lookup data

            PeekModelGridLookupStore.prototype._init = function () {
                var self = this;

                function makeEndpoint(key, lookupName, callback) {
                    // Send after vortex is initiaised
                    vortexSendFilt({'key': key});

                    return new PayloadEndpoint({'key': key},
                            function (payload) {
                                if (payload.result) {
                                    logError(payload.result);
                                    return false;
                                }

                                self[lookupName] = {};
                                for (var i = 0; i < payload.tuples.length; i++) {
                                    var item = payload.tuples[i];
                                    self[lookupName][item.id] = item;
                                }

                                if (callback != null)
                                    callback();

                                self._lookupLoadCount++;
                            });
                }

                var levelEndpoint = makeEndpoint("c.s.p.model.disp.level", "_levelsById");
                var layerEndpoint = makeEndpoint("c.s.p.model.disp.layer", "_layersById");
                var colorEndpoint = makeEndpoint("c.s.p.model.disp.color", "_colorsById",
                        bind(self, self._validateColors));
                var textStyleEndpoint = makeEndpoint("c.s.p.model.disp.text_style", "_textStyleById");
                var lineStyleEndpoint = makeEndpoint("c.s.p.model.disp.line_style", "_lineStyleById");


                // self.loadFromDispCache(DRESSING_COORD_SET_ID, ["dressings"], "from_cache");
            };


// ============================================================================
// Load Callbacks

            PeekModelGridLookupStore.prototype._validateColors = function () {
                var self = this;

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

                    var image = document.createElement("img");
                    image.style.color = "rgb(0, 0, 0)";
                    image.style.color = stringToTest;
                    if (image.style.color !== "rgb(0, 0, 0)") {
                        return true;
                    }
                    image.style.color = "rgb(255, 255, 255)";
                    image.style.color = stringToTest;
                    return image.style.color !== "rgb(255, 255, 255)";
                }

                var colors = dictValuesFromObject(self._colorsById);
                for (var i = 0; i < colors.length; i++) {
                    var color = colors[i];
                    if (!validTextColor(color.color)) {
                        console.log("Color " + color.color + " is not a valid CSS color");
                        color.color = "green";
                    }
                }

            };


// ============================================================================
// Accessors

            PeekModelGridLookupStore.prototype.levelForId = function (levelId) {
                var self = this;
                return self._levelsById[levelId];
            };

            PeekModelGridLookupStore.prototype.layerForId = function (layerId) {
                var self = this;
                return self._layersById[layerId];
            };

            PeekModelGridLookupStore.prototype.colorForId = function (colorId) {
                var self = this;
                return self._colorsById[colorId];
            };

            PeekModelGridLookupStore.prototype.textStyleForId = function (textStyleId) {
                var self = this;
                return self._textStyleById[textStyleId];
            };

            PeekModelGridLookupStore.prototype.lineStyleForId = function (lineStyleId) {
                var self = this;
                return self._lineStyleById[lineStyleId];
            };

            PeekModelGridLookupStore.prototype.dispGroupForId = function (dispGroupId) {
                var self = this;
                return self._dispGroupById[dispGroupId];
            };

            PeekModelGridLookupStore.prototype._sortDictValuesByOrder = function (thingsById) {
                var self = this;
            };

            PeekModelGridLookupStore.prototype.layersOrderedByOrder = function () {
                var self = this;

                function comp(o1, o2) {
                    return o1.order - o2.order;
                }

                // Lazy instantiation
                if (!self.isReady())
                    return [];

                if (self._layersOrderedByOrder == null)
                    self._layersOrderedByOrder = dictValuesFromObject(self._layersById).sort(comp);

                return self._layersOrderedByOrder;
            };

            PeekModelGridLookupStore.prototype.levelsOrderedByOrder = function (coordSetId) {
                var self = this;

                function comp(o1, o2) {
                    return o1.order - o2.order;
                }

                if (!self.isReady())
                    return [];

                // Lazy instantiation
                if (self._levelsByCoordSetIdOrderedByOrder == null) {
                    var dict = {};
                    self._levelsByCoordSetIdOrderedByOrder = dict;

                    var ordered = dictValuesFromObject(self._levelsById).sort(comp);

                    for (var i = 0; i < ordered.length; i++) {
                        var level = ordered[i];

                        if (dict[level.coordSetId] == null)
                            dict[level.coordSetId] = [];

                        dict[level.coordSetId].push(level);
                    }
                }

                return self._levelsByCoordSetIdOrderedByOrder[coordSetId];
            };


            PeekModelGridLookupStore.prototype.linkDispLookups = function (disp) {
                var self = this;

                if (disp.le != null) {
                    disp.level = self._levelsById[disp.le];
                    if (disp.level == null) return null;
                }

                if (disp.la != null) {
                    disp.layer = self._layersById[disp.la];
                    if (disp.layer == null) return null;
                }

                if (disp.fs != null) {
                    disp.textStyle = self._textStyleById[disp.fs];
                    if (disp.textStyle == null) return null;
                }

                if (disp.c != null) {
                    disp.color = self._colorsById[disp.c];
                    if (disp.color == null) return null;
                }

                if (disp.lc != null) {
                    disp.lineColor = self._colorsById[disp.lc];
                    if (disp.lineColor == null) return null;
                }

                if (disp.fc != null) {
                    disp.fillColor = self._colorsById[disp.fc];
                    if (disp.fillColor == null) return null;
                }

                if (disp.ls != null) {
                    disp.lineStyle = self._lineStyleById[disp.ls];
                    if (disp.lineStyle == null) return null;
                }

                return disp;
            };


// ============================================================================
// Create manage model single instance

            return PeekModelGridLookupStore;
        }
)
;
