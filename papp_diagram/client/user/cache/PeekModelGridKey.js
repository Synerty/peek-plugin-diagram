/**
 * Created by Jarrod Chesney on 13/03/16.
 */

'use strict';

var GRID_SIZES = {
    0: {min: 0.0, max: 0.04, key: 0, xGrid: 30000, yGrid: 30000},
    1: {min: 0.04, max: 0.1, key: 1, xGrid: 10000, yGrid: 10000},
    2: {min: 0.1, max: 0.5, key: 2, xGrid: 2000, yGrid: 2000},
    3: {min: 0.5, max: 1000.0, key: 3, xGrid: 1000, yGrid: 1000},
};

// ============================================================================
// gridKey generation functions

function gridSizeForZoom(zoom) {
    assert(zoom != null, "Zoom can't be null");

    // Figure out the Z grid
    var gridSize = null;
    for (var gridSizeKey in GRID_SIZES) {
        gridSize = GRID_SIZES[gridSizeKey];
        if (gridSize.min <= zoom && zoom < gridSize.max) {
            break;
        }
    }
    assert(gridSize != null);
    return gridSize;
}

function gridKeysForArea(coordSetId, area, zoom) {
    var self = this;

    var gridSize = gridSizeForZoom(zoom);

    // Round the X min/max
    var minGridX = parseInt(area.x / gridSize.xGrid);
    var maxGridX = parseInt((area.x + area.w) / gridSize.xGrid) + 1;

    // Round the Y min/max
    var minGridY = parseInt(area.y / gridSize.yGrid);
    var maxGridY = parseInt((area.y + area.h) / gridSize.yGrid) + 1;

    // Iterate through and create the grids.
    var gridKeys = [];
    for (var x = minGridX; x < maxGridX; x++) {
        for (var y = minGridY; y < maxGridY; y++) {
            gridKeys.push(coordSetId.toString() + "|" + gridSize.key + "." + x + 'x' + y);
        }
    }

    return gridKeys;
}

/*
 function gridKeysForGeom(coordSetId, geom, levelId, uniqueTest, level) {
 var self = this;

 if (uniqueTest === undefined)
 uniqueTest = true;

 var dispLevel = level != null ? level : peekModelCache.levelForId(levelId);

 if (dispLevel === undefined) {
 var msg = "The IndexedDB is out of sync, can't find level for levelId " + levelId;
 throw new AssertException(msg);
 }

 var hash = {};
 var gridKeys = [];

 for (var gridSizekey in GRID_SIZES) {
 var gridSize = GRID_SIZES[gridSizekey];

 // If this thing is NOT on at any point in this grid size, then skip it
 if (0 > (Math.min(gridSize.max, (dispLevel.maxZoom - 0.00001))
 - Math.max(gridSize.min, dispLevel.minZoom))) {
 continue;
 }

 for (var i = 0; i < geom.length; i++) {
 var gridKey = coordSetId.toString()
 + "|" + gridSize.key
 + "." + parseInt(geom[i].x / gridSize.xGrid)
 + "x" + parseInt(geom[i].y / gridSize.yGrid);

 // Make this check optional for a small performance boost
 if (uniqueTest === true) {
 if (hash[gridKey] === true)
 continue;
 hash[gridKey] = true;
 }

 gridKeys.push(gridKey);
 }
 }

 return gridKeys;
 }
 */