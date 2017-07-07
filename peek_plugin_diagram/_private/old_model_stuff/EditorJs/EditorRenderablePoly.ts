// ============================================================================
// Poly Point

function PolyPoint(polyId, x, y, index) {
    this._tupleType = 'canvas.renderable.poly.point';
    this.left = x || 0;
    this.top = y || 0;
    this.index = index || 0;
    this._poly = polyId;

    this._fields = this._fields.concat(['left', 'top', 'index', 'poly']);
}
PolyPoint.inheritsFrom(Storable);
PolyPoint.TAG_NAME = 'poly_point';
registerTupleType(PolyPoint);

PolyPoint.prototype.createFromXml = function (xmlTag) {
    var point = new PolyPoint();
    point.updateFromXml(xmlTag);
    return point
};

PolyPoint.prototype.tagName = function () {
    return PolyPoint.TAG_NAME;
};

// Class function
PolyPoint.comparitor = function (o1, o2) {
    return o1.index - o2.index;
};

PolyPoint.prototype.coord = function (polyRenderable) {
    return {x: this.left + polyRenderable.left, y: this.top + polyRenderable.top};
};

// ============================================================================
// Poly Renderable

function PolyRenderable(x, y) {
    this._tupleType = 'canvas.renderable.poly';
    this.type = Renderable.POLY;

    this.left = x || 0;
    this.top = y || 0;
    this.closed = false;
    this.rotation = 0;
    this.fillColor = null;
    this.lineColor = 'red';
    this.lineSize = 1;

    this._fields = this._fields.concat(['left', 'top', 'closed', 'rotation',
        'fillColor', 'lineColor', 'lineSize']);

    this.points = [];

    this._addins = [];

    this._bounds = new Bounds();

    this._validate();
}
PolyRenderable.inheritsFrom(Renderable);
registerTupleType(PolyRenderable);

PolyRenderable.prototype.createXmlDoc = function () {
    // Create the xml doc for this renderable
    var xml = this.parent.createXmlDoc.call(this);

    // Create the xml tags for the poly points that this renderable owns
    for (var i = 0; i < this.points.length; ++i) {
        this.points[i].createXmlDoc(xml.doc, xml.tag);
    }

    return xml;
}

PolyRenderable.prototype.updateFromXml = function (xmlTag) {
    // Just reload all the points
    this.points = [];

    // Load the poly tags
    var polyPointTags = xmlTag.getElementsByTagName(PolyPoint.TAG_NAME);
    while (polyPointTags.length) {
        var polyPointTag = polyPointTags[0];
        this.points.push(PolyPoint.prototype.createFromXml(polyPointTag));

        // Remove each of the points from this poly_renderable tag otherwise
        // it will cause issues when loading from the fields
        // Removing this will remove the node from the NodeList we're iterating
        // over. Pretty cool.
        xmlTag.removeChild(polyPointTag);
    }
    this.points.sort(PolyPoint.comparitor);

    // Load this objects data from the xml tag
    this.parent.updateFromXml.call(this, xmlTag);
}

PolyRenderable.prototype.clone = function () {
    var r = Storable.prototype.clone.call(this);

    // Create the xml tags for the poly points that this renderable owns
    for (var i = 0; i < this.points.length; ++i) {
        var p = this.points[i].clone();
        p._poly = null;
        r.points.push(p);
    }

    return r;
}

PolyRenderable.prototype.draw = function (ctx) {
    var lx = this.left; // Low x
    var ux = this.left; // Upper x
    var ly = this.top; // Low y
    var uy = this.top; // Upper y

    ctx.beginPath();
    ctx.moveTo(this.left, this.top);

    for (var i = 0; i < this.points.length; ++i) {
        var point = this.points[i];
        // Calculate the point
        var x = this.left + point.left;
        var y = this.top + point.top;

        // Draw the segment
        ctx.lineTo(x, y);

        // Work out our bounds
        if (x < lx)
            lx = x;
        if (ux < x)
            ux = x;
        if (y < ly)
            ly = y;
        if (uy < y)
            uy = y;
    }

    if (this.closed)
        ctx.closePath();

    if (this.fillColor) {
        ctx.fillStyle = this.fillColor;
        ctx.fill();
    }

    if (this.lineColor) {
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineSize;
        ctx.stroke();
    }

    this._bounds.x = lx;
    this._bounds.y = ly;
    this._bounds.w = ux - lx;
    this._bounds.h = uy - ly;

}

// Inherited objects may need to override this
PolyRenderable.prototype.deltaResize = function (dw, dh) {
    if (this.pointCount() != 2) {
        return {
            dw: 0.0,
            dh: 0.0
        };
    }

    // Support for resizing single lines only
    var p = this.points[0];

    if (0 < p.left) {
        p.left += dw;
    } else {
        this.left += dw;
        p.left -= dw;
    }

    if (0 < p.top) {
        p.top += dh;
    } else {
        this.top += dh;
        p.top -= dh;
    }

    // this.movePoint(1, dw, dh);
    return {
        dw: dw,
        dh: dh
    };
};


// Inherited objects may need to override this
PolyRenderable.prototype.deltaMoveHandle = function (dx, dy, handle, handleIndex) {
    var self = this;

    if (handleIndex == 0) {
        self.left += dx;
        self.top += dy;
        for (var i = 0; i < self.points.length; ++i) {
            var point = self.points[i];
            point.left -= dx;
            point.top -= dy;
        }
    } else {
        var point = self.points[handleIndex - 1];
        point.left += dx;
        point.top += dy;
    }

};

PolyRenderable.prototype.typeName = function () {
    if (this.points.length == 0)
        return "Invalid poly object (no points)"

    if (this.points.length == 1)
        return "Line";

    if (this.closed)
        return "Polygon";

    return "Polyline";
};

PolyRenderable.prototype.toString = function () {
    var self = this;

    var str = self.parent.toString.call(this);
    str += "\n" + (self.points.length + 1) + " points";
    str += "\n";
    for (var i = 0; i < self.points.length; i++) {
        var p = self.points[0];
        var h = Math.sqrt(Math.pow(p.left, 2) + Math.pow(p.top, 2));
        str += (Math.round(h * 100) / 100) + ", ";
    }
    return str;
};

// ---------------
// Image specific functions

PolyRenderable.prototype.addPoint = function (x, y) {
    var dx = x - this.left;
    var dy = y - this.top;
    var point = new PolyPoint(this.id, dx, dy, this.points.length);
    this.points.push(point);
};

PolyRenderable.prototype.movePoint = function (index, x, y) {
    if (index == undefined || index < 0 || this.points.length < index)
        return false;

    // First point is this poly renderable instance
    if (index == 0) {
        this.left = x;
        this.top = y;
        return true;
    }

    var point = this.points[index - 1];
    point.left = x - this.left;
    point.top = y - this.top;
    return true;
};

PolyRenderable.prototype.popPoint = function () {
    if (this.points.length)
        this.points.pop();
};

PolyRenderable.prototype.pointCount = function () {
    return this.points.length + 1;
}

PolyRenderable.prototype.pointCoord = function (index) {
    if (index == undefined || index < 0 || this.points.length < index)
        return false;

    // First point is this poly renderable instance
    if (index == 0)
        return new Coord(this.left, this.top);

    var point = this.points[index - 1];
    return new Coord(this.left + point.left, this.top + point.top);
};

PolyRenderable.prototype.setClosed = function (closed) {
    this.closed = closed;
};

PolyRenderable.prototype.lastPoint = function () {
    return this.points[this.points.length - 1];
};

PolyRenderable.prototype._validate = function () {
    var changeRequired = false;
    return changeRequired;
};

// Determine if a point is inside the shape's bounds
PolyRenderable.prototype.contains = function (x, y, margin) {
    var self = this;

    if (!self._bounds.contains(x, y, margin))
        return false;

    if (self.closed) {
        /** Using the polygon line segment crossing algorithm.
         */
        function rayCrossesSegment(point, a, b) {
            var px = point.x;
            var py = point.y;
            var swap = a.y > b.y;
            var ax = swap ? b.x : a.x;
            var ay = swap ? b.y : a.y;
            var bx = swap ? a.x : b.x;
            var by = swap ? a.y : b.y;

            // alter longitude to cater for 180 degree crossings
            if (px < 0)
                px += 360
            if (ax < 0)
                ax += 360
            if (bx < 0)
                bx += 360

            if (py == ay || py == by) py += 0.00000001;
            if ((py > by || py < ay) || (px > Math.max(ax, bx))) return false;
            if (px < Math.min(ax, bx)) return true;

            var red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
            var blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
            return (blue >= red);
        }

        var crossings = 0;

        var p1 = {x: self.left, y: self.top};
        for (var i = 0; i <= self.points.length; ++i) {
            var thisPoint = self.points[i];
            var p2 = (i == self.points.length)
                    ? {x: self.left, y: self.top} // The closing point
                    : thisPoint.coord(self);

            if (rayCrossesSegment({x: x, y: y}, p1, p2))
                crossings++;

            p1 = p2;
        }

        // odd number of crossings?
        return (crossings % 2 == 1);

    } else {

        var x1 = self.left;
        var y1 = self.top;
        for (var i = 0; i < self.points.length; ++i) {
            var x2 = self.points[i].left + self.left;
            var y2 = self.points[i].top + self.top;


            var dx = x2 - x1;
            var dy = y2 - y1;

            var slope = dy / dx;
            // y = mx + c
            // intercept c = y - mx
            var intercept = y1 - slope * x1; // which is same as y2 - slope * x2

            // For Bounding Box
            var left = (x1 < x2 ? x1 : x2) - margin;
            var right = (x1 < x2 ? x2 : x1) + margin;
            var top = (y1 < y2 ? y1 : y2) - margin;
            var bottom = (y1 < y2 ? y2 : y1) + margin;

            var yVal = slope * x + intercept;
            var xVal = (y - intercept) / slope;

            if (((y - margin) < yVal && yVal < (y + margin)
                    || (x - margin) < xVal && xVal < (x + margin))
                    && (left <= x && x <= right && top <= y && y <= bottom))
                return true;


            x1 = x2;
            y1 = y2;
        }

        return false;
    }
};


/**
 * Resize Handles
 *
 * Generate an array of "Bounds" objects that represent this renderables handles
 */
PolyRenderable.prototype.handles = function () {
    var self = this;
    var result = [];

    var MARG = Renderable.RESIZE_HANDLE_MARGIN;
    var WID = Renderable.RESIZE_HANDLE_WIDTH;
    var HALF_WID = WID / 2.0;

    function addHandle(p, ref) {
        var adj = (p.x - ref.x);
        var opp = (p.y - ref.y);
        var hypot = Math.sqrt(Math.pow(adj, 2) + Math.pow(opp, 2));

        var multiplier = (WID + MARG) / hypot;

        result.push(new Bounds(p.x + adj * multiplier - HALF_WID,
                p.y + opp * multiplier - HALF_WID,
                WID,
                WID));
    }

    //function rotatePoint(point, theta) {
    //    /* Rotates the given polygon which consists of corners represented as (x,y),
    //     around the ORIGIN, clock-wise, theta degrees */
    //    var simTheta = Math.sin(theta);
    //    var cosTheta = Math.cos(theta);
    //
    //    return {
    //        x: point.x * cosTheta - point.y * simTheta,
    //        y: point.y = point.x * simTheta + point.y * cosTheta
    //    };
    //}
    //
    ///*
    //* Calculates the angle ABC (in radians)
    //*
    //* A first point
    //* C second point
    //* B center point
    //*/
    //function findAngle(A, B, C) {
    //    var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
    //    var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    //    var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
    //    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    //}


    var firstXy = {x: self.left, y: self.top};
    addHandle(firstXy, self.points[0].coord(self));

    var lastXy = firstXy;
    for (var i = 0; i < self.points.length; ++i) {
        var thisXy = self.points[i].coord(self);
        var refXy = lastXy;
        if (i + 1 < self.points.length) {
            var nextXy = self.points[i + 1].coord(self);

            //var angle = findAngle(lastXy, thisXy, nextXy);
            //refXy = rotatePoint({x:lastXy.x - self.left, y:lastXy.y - self.top}, angle / 2);

            refXy.x = (lastXy.x + nextXy.x) / 2;
            refXy.y = (lastXy.y + nextXy.y) / 2;
        }
        addHandle(thisXy, refXy);
    }

    return result;
};
