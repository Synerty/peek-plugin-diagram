/*
 * util.js
 *
 *  Copyright Synerty Pty Ltd 2013
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 */

"use strict";

// / ---------------------------------------------------------------------------
// / Data Type Classes
// / ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Coord
// ---------------------------------------------------------------------------
function Coord(x, y) {
    if (x == null)
        this.x = 0.0;
    else
        this.x = parseFloat(x);

    if (y == null)
        this.y = 0.0;
    else
        this.y = parseFloat(y);
}

Coord.prototype.snap = function (snapSize) {
    this.x = Coord.snap(this.x, snapSize);
    this.y = Coord.snap(this.y, snapSize);
};

// Class method
Coord.snap = function (val, snapSize) {
    return Math.round(val / snapSize) * snapSize;
};

