// ============================================================================
// Editor Object

/**
 * Editor Object This class is the base class for all objects
 *
 */
function Renderable() {
    this.type = null;
    this.layerId = null;
    this.zorder = null;
    this.comment = "";
    this.props = {};

    this._fields = this._fields.concat(['type', 'page', 'layerId', 'zorder',
        'comment', 'props']);

    // Inherited objects need to define their own instance of this
    // Addins for this renderable
    this._addins = null;

    // Inherited objects need to define their own instance of this
    this._bounds = null;
}
Renderable.inheritsFrom(Storable);

Renderable.TAG_NAME = 'renderable';

// Must align with constants in storage Renderable class
// Renderable types
Renderable.RECTANGLE = 0;
Renderable.TEXT = 1;
Renderable.POLY = 2;
Renderable.OVAL = 3;
Renderable.IMAGE = 4;

// Default handles
Renderable.HANDLE_NONE = -1;
Renderable.HANDLE_TOP_LEFT = 0;
Renderable.HANDLE_TOP_CENTER = 3;
Renderable.HANDLE_TOP_RIGHT = 5;
Renderable.HANDLE_CENTER_LEFT = 1;
Renderable.HANDLE_CENTER_RIGHT = 6;
Renderable.HANDLE_BOTTOM_LEFT = 2;
Renderable.HANDLE_BOTTOM_CENTER = 4;
Renderable.HANDLE_BOTTOM_RIGHT = 7;

Renderable.RESIZE_HANDLE_MARGIN = 3.0;
Renderable.RESIZE_HANDLE_WIDTH = 6.0;

// Class method
Renderable.getConstructor = function (type) {
    switch (parseInt(type)) {
        case Renderable.RECTANGLE:
            return RectangleRenderable;
        case Renderable.TEXT:
            return TextRenderable;
        case Renderable.POLY:
            return PolyRenderable;
        case Renderable.OVAL:
            return OvalRenderable;
        case Renderable.IMAGE:
            return ImageRenderable;
        default:
            assert(false, "Can not create Renderable of type |" + type + "|");
    }
};

Renderable.prototype.createFromXml = function (xmlTag) {
    var type = xmlGetChildrenByTag(xmlTag, 'type')[0].firstChild.nodeValue;
    type = parseInt(type);

    var Constructor = Renderable.getConstructor(type);

    var renderable = new Constructor();
    renderable.updateFromXml(xmlTag);
    return renderable;

}

Renderable.prototype.createXmlDoc = function () {
    // Create the xml doc for this renderable
    var xml = Storable.prototype.createXmlDoc.call(this);

    // Create the xml tags for the poly points that this renderable owns
    for (var i = 0; i < this._addins.length; ++i) {
        this._addins[i].createXmlDoc(xml.doc, xml.tag);
    }

    return xml;
};

Renderable.prototype.updateFromXml = function (xmlTag) {
    // Just reload all the points
    this._addins = [];

    // Load the poly tags
    var addinTags = xmlTag.getElementsByTagName(Addin.TAG_NAME);
    while (addinTags.length) {
        var addinTag = addinTags[0];
        this._addins.push(Addin.prototype.createFromXml(addinTag));

        // Remove each of the addins from this renderable tag otherwise
        // it will cause issues when loading from the fields
        // Removing this will remove the node from the NodeList we're iterating
        // over. Pretty cool.
        xmlTag.removeChild(addinTag);
    }

    // Load this objects data from the xml tag
    Storable.prototype.updateFromXml.call(this, xmlTag);
};

Renderable.prototype.clone = function () {
    var r = Storable.prototype.clone.call(this);

    // Create the xml tags for the poly points that this renderable owns
    for (var i = 0; i < this._addins.length; ++i) {
        var a = this._addins[i].clone();
        a.setRenderable = null;
        r._addins.push(a);
    }

    return r;
};

Renderable.prototype.tagName = function () {
    return Renderable.TAG_NAME;
};

Renderable.prototype.layerName = function () {
    return editorLayer.layerById(this.layerId).name;
};

Renderable.prototype.setLayer = function (layer) {
    this.layerId = layer;
};

Renderable.prototype.setZorder = function (zorder) {
    this.zorder = zorder;
};

Renderable.prototype.draw = function () {
    alert("Not implemented");
};


/**
 * Draw Selected
 *
 * Draw the selected highight for this renderable
 */
Renderable.prototype.drawSelected = function (ctx) {
    // DRAW THE SELECTED BOX
    var bounds = this.bounds();
    // Move the selection line a bit away from the object
    var offset = CanvasRenderer.SELECTION_WIDTH + CanvasRenderer.SELECTION_LINE_GAP;
    var twiceOffset = 2 * offset;
    bounds.x -= offset;
    bounds.y -= offset;
    bounds.w += twiceOffset;
    bounds.h += twiceOffset;

    ctx.dashedRect(bounds.x, bounds.y, bounds.w, bounds.h, CanvasRenderer.SELECTION_DASH_LEN);
    ctx.strokeStyle = CanvasRenderer.SELECTION_COLOR;
    ctx.lineWidth = CanvasRenderer.SELECTION_WIDTH;
    ctx.stroke();

    // DRAW THE EDIT HANDLES
    ctx.fillStyle = CanvasRenderer.SELECTION_COLOR;
    var handles = this.handles();
    for (var i = 0; i < handles.length; ++i) {
        var handle = handles[i];
        ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
    }
};

// Determine if this bounds is within given box
Renderable.prototype.snap = function (snapSize) {
    var b = this._bounds;
    var dx = Coord.snap(b.x, snapSize) - b.x;
    var dy = Coord.snap(b.y, snapSize) - b.y;
    var dw = Coord.snap(b.w, snapSize) - b.w;
    var dh = Coord.snap(b.h, snapSize) - b.h;

    if (dx || dy)
        this.deltaMove(dx, dy);

    if (dw || dh) {
        var resizeDelta = this.deltaResize(dw, dh);
        dw = resizeDelta.dw;
        dh = resizeDelta.dh;
    }

    return {
        deltaApplied: dx || dy || dw || dh,
        dx: dx,
        dy: dy,
        dw: dw,
        dy: dy
    };
}

// Determine if this bounds is within given box
Renderable.prototype.withIn = function (x, y, w, h) {
    return this._bounds.isWithIn(x, y, w, h);
};

// Determine if a point is inside the shape's bounds
Renderable.prototype.contains = function (x, y, margin) {
    return this._bounds.contains(x, y, margin);
};

// Determine if another renderable is similar to this one
Renderable.prototype.similarTo = function (renderable) {
    var fields = this._fields.slice(0).remove(["id", "left", "top"]);

    for (var i = 0; i < fields.length; ++i) {
        var field = "_" + fields[i];
        if (renderable[field] != this[field])
            return false;
    }
    return true;
};

// Inherited objects may need to override this
Renderable.prototype.move = function (x, y) {
    assert(this.left != undefined && this.top != undefined,
            "Renderable doesn't support move");
    this.left = x;
    this.top = y;
};

// Inherited objects may need to override this
Renderable.prototype.deltaMove = function (dx, dy) {
    assert(this.left != undefined && this.top != undefined,
            "Renderable doesn't support deltaMove");
    this.left += dx;
    this.top += dy;
};


// Inherited objects may need to override this
Renderable.prototype.deltaMoveHandle = function (dx, dy, handle, handleIndex) {
    var self = this;

    switch (handleIndex) {
        case Renderable.HANDLE_TOP_LEFT:
            var resize = self.deltaResize(-dx, -dy);
            self.deltaMove(-resize.dw, -resize.dh);
            break;
        case Renderable.HANDLE_TOP_CENTER:
            var resize = self.deltaResize(0, -dy);
            self.deltaMove(0, -resize.dh);
            break;
        case Renderable.HANDLE_TOP_RIGHT:
            var resize = self.deltaResize(dx, -dy);
            self.deltaMove(0, -resize.dh);
            break;
        case Renderable.HANDLE_CENTER_LEFT:
            var resize = self.deltaResize(-dx, 0);
            self.deltaMove(-resize.dw, 0);
            break;
        case Renderable.HANDLE_CENTER_RIGHT:
            self.deltaResize(dx, 0);
            break;
        case Renderable.HANDLE_BOTTOM_LEFT:
            var resize = self.deltaResize(-dx, dy);
            self.deltaMove(-resize.dw, 0);
            break;
        case Renderable.HANDLE_BOTTOM_CENTER:
            self.deltaResize(0, dy);
            break;
        case Renderable.HANDLE_BOTTOM_RIGHT:
            self.deltaResize(dx, dy);
            break;
    }
};

Renderable.prototype.resize = function (w, h) {
    assert(this.width != undefined && this.height != undefined,
            "Renderable doesn't support resize");

    if (w <= 0)
        w = 1;

    if (h <= 0)
        h = 1;

    this.width = w;
    this.height = h;

    this._bounds.w = this.width;
    this._bounds.h = this.height;
};

// Inherited objects may need to override this
Renderable.prototype.deltaResize = function (dw, dh) {
    assert(this.width != undefined && this.height != undefined,
            "Renderable doesn't support deltaResize");

    if (this.width <= -dw)
        dw = 0;
    if (this.height <= -dh)
        dh = 0;

    this.width += dw;
    this.height += dh;

    return {
        dw: dw,
        dh: dh
    };
};

Renderable.prototype.bounds = function () {
    return new Bounds(this._bounds);
};

Renderable.prototype.toString = function () {
    var x = Math.round(this._bounds.x * 100) / 100;
    var y = Math.round(this._bounds.y * 100) / 100;
    var w = Math.round(this._bounds.w * 100) / 100;
    var h = Math.round(this._bounds.h * 100) / 100;
    var str = this.typeName() + " : "
            + x + "x " + y + "y "
            + w + "w " + h + "h ";
    if (this.comment && this.comment.length)
        str += '\nComment : ' + this.comment;

    for (key in this.props) {
        str += '\n' + key + ' : ' + this.props[key];
    }

    return str;
};


/**
 * Resize Handles
 *
 * Generate an array of "Bounds" objects that represent this renderables handles
 */
Renderable.prototype.handles = function () {
    var result = [];

    var selBox = new Bounds(this.bounds());
    var MARG = Renderable.RESIZE_HANDLE_MARGIN;
    var WID = Renderable.RESIZE_HANDLE_WIDTH;
    var HALF_WID = WID / 2.0;
    selBox.x = selBox.x - MARG - HALF_WID;
    selBox.y = selBox.y - MARG - HALF_WID;
    selBox.w = selBox.w + 2.0 * MARG + WID;
    selBox.h = selBox.h + 2.0 * MARG + WID;

    for (var xi = 0; xi < 3; ++xi) {
        var x = selBox.x - HALF_WID + xi * selBox.w / 2.0;
        for (var yi = 0; yi < 3; ++yi) {
            if (xi == 1 && yi == 1)
                continue;
            var y = selBox.y - HALF_WID + yi * selBox.h / 2.0;
            result.push(new Bounds(x, y, WID, WID));
        }
    }

    return result;
};


// ============================================================================
// Rectangle

function RectangleRenderable(x, y, w, h, fill) {
    this._tupleType = 'canvas.renderable.rectange';
    this.type = Renderable.RECTANGLE;

    this.left = x || 0;
    this.top = y || 0;
    this.width = w || 1;
    this.height = h || 1;
    this.fillColor = fill || 'rgba(0,255,0,.6)';
    this.lineColor = null;
    this.lineSize = 1;
    this.cornerRadius = 0;
    this.rotation = 0;

    this._fields = this._fields.concat(['left', 'top', 'width', 'height',
        'fillColor', 'lineColor', 'lineSize', 'cornerRadius', 'rotation']);

    this._addins = [];

    this._bounds = new Bounds(this.left, this.top, this.width, this.height);

    this._validate();
}
RectangleRenderable.inheritsFrom(Renderable);
registerTupleType(RectangleRenderable);

RectangleRenderable.prototype.draw = function (ctx) {

    ctx.save();
    ctx.translate(this.left, this.top);
    ctx.rotate(this.rotation * Math.PI / 180); // Degrees to radians

    if (this.cornerRadius) {
        ctx.roundRect(0, // LEFT
                0, // TOP
                this.width,
                this.height,
                this.cornerRadius);
    } else {
        ctx.beginPath();
        ctx.rect(0, // LEFT
                0, // TOP
                this.width,
                this.height);
        ctx.closePath();
    }

    if (this.fillColor) {
        ctx.fillStyle = this.fillColor;
        ctx.fill();
    }

    if (this.lineColor) {
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineSize;
        ctx.stroke();
    }

    ctx.restore();

    this._bounds.x = this.left;
    this._bounds.y = this.top;
    this._bounds.w = this.width;
    this._bounds.h = this.height;
};

RectangleRenderable.prototype.typeName = function () {
    if (this.width == this.height)
        return "Square";
    return "Rectangle";
};

// ---------------
// Rectangle specific functions

RectangleRenderable.prototype._validate = function () {
    var changeRequired = false;
    if (this.width < 0) {
        this.left += this.width;
        this.width *= -1;
        changeRequired = true;
    }

    if (this.height < 0) {
        this.top += this.height;
        this.height *= -1;
        changeRequired = true;
    }

    if (this.width == 0) {
        this.width = 5;
        changeRequired = true;
    }

    if (this.height == 0) {
        this.height = 5;
        changeRequired = true;
    }

    return changeRequired;
};

// ============================================================================
// Oval

function OvalRenderable(x, y, w, h, fill) {
    this._tupleType = 'canvas.renderable.oval';
    this.type = Renderable.OVAL;

    this.left = x || 0;
    this.top = y || 0;
    this.width = w || 1;
    this.height = h || 1;
    this.startAngle = 0;
    this.endAngle = 360;
    this.fillColor = fill || 'rgba(0,255,0,.6)';
    this.lineColor = null;
    this.lineSize = 1;

    this._fields = this._fields.concat(['left', 'top', 'width', 'height',
        'startAngle', 'endAngle', 'fillColor', 'lineColor', 'lineSize']);

    this._addins = [];

    this._bounds = new Bounds(this.left, this.top, this.width, this.height);

    this._validate();
}
OvalRenderable.inheritsFrom(Renderable);
registerTupleType(OvalRenderable);

OvalRenderable.prototype.draw = function (ctx) {

    var yScale = parseFloat(this.height) / parseFloat(this.width);
    var halfW = this.width / 2;
    var halfH = this.height / 2;

    // save state
    ctx.save();
    ctx.translate(this.left + halfW, this.top + halfH);
    ctx.scale(1, yScale);

    var startRadian = 2 * this.startAngle / 360.0 * Math.PI;
    var endRadian = 2 * this.endAngle / 360.0 * Math.PI;

    ctx.beginPath();
    ctx.arc(0, 0, halfW, startRadian, endRadian, false);
    ctx.closePath();

    // restore to original state
    ctx.restore();

    if (this.fillColor) {
        ctx.fillStyle = this.fillColor;
        ctx.fill();
    }

    if (this.lineColor) {
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineSize;
        ctx.stroke();
    }

    this._bounds.x = this.left;
    this._bounds.y = this.top;
    this._bounds.w = this.width;
    this._bounds.h = this.height;
};

OvalRenderable.prototype.typeName = function () {
    if (this.width == this.height)
        return "Circle";
    return "Oval";
};

// ---------------
// Oval specific functions

OvalRenderable.prototype._validate = function () {
    var changeRequired = false;
    if (this.width < 0) {
        this.left += this.width;
        this.width *= -1;
        changeRequired = true;
    }

    if (this.height < 0) {
        this.top += this.height;
        this.height *= -1;
        changeRequired = true;
    }

    if (this.width == 0) {
        this.width = 5;
        changeRequired = true;
    }

    if (this.height == 0) {
        this.height = 5;
        changeRequired = true;
    }

    return changeRequired;
};

// ============================================================================
// Text

function TextRenderable(x, y, text) {
    this._tupleType = 'canvas.renderable.text';
    this.type = Renderable.TEXT;

    this.left = x || 0;
    this.top = y || 0;
    this.alignX = null; // 'center'
    this.alignY = null; // 'middle'
    this.rotation = 0;
    this.text = text || "New Text Label";
    this.fontName = "GillSans";
    this.fontSize = 12;
    this.fontStyle = null;
    this.fillColor = "black";
    this.lineColor = null;
    this.lineSize = 1;

    this._fields = this._fields.concat(['left', 'top', 'alignX', 'alignY',
        'rotation', 'text', 'fontName', 'fontSize', 'fontStyle',
        'fillColor', 'lineColor', 'lineSize']);

    this._addins = [];

    this._bounds = new Bounds();

    this._validate();
}
TextRenderable.inheritsFrom(Renderable);
registerTupleType(TextRenderable);

TextRenderable.prototype.draw = function (ctx) {

    // save state
    ctx.save();
    ctx.translate(this.left, this.top);
    ctx.rotate(this.rotation * Math.PI / 180); // Degrees to radians

    ctx.font = (this.fontStyle || '') + " " + (this.fontSize || '') + "pt "
            + (this.fontName || '');

    var lineHeight = pointToPixel(this.fontSize);

    if (this.alignX == -1)
        ctx.textAlign = 'start';
    else if (this.alignX == 0)
        ctx.textAlign = 'center';
    else if (this.alignX == 1)
        ctx.textAlign = 'end';

    if (this.alignY == -1)
        ctx.textBaseline = 'top';
    else if (this.alignY == 0)
        ctx.textBaseline = 'middle';
    else if (this.alignY == 1)
        ctx.textBaseline = 'bottom';

    var lines = this.text.split("\n");
    for (var lineIndex = 0; lineIndex < lines.length; ++lineIndex) {
        var line = lines[lineIndex];
        var yOffset = lineHeight * lineIndex;

        if (this.fillColor) {
            ctx.fillStyle = this.fillColor;
            ctx.fillText(line, 0, yOffset);
        }

        if (this.lineColor) {
            ctx.lineWidth = this.lineSize;
            ctx.strokeStyle = this.lineColor;
            ctx.strokeText(line, 0, yOffset);
        }
    }

    this._bounds.w = ctx.measureText(this.text).width;
    this._bounds.h = lineHeight * lines.length;

// restore to original state
    ctx.restore();

    if (this.alignX == -1)
        this._bounds.x = this.left;
    else if (this.alignX == 0)
        this._bounds.x = this.left - this._bounds.w / 2;
    else if (this.alignX == 1)
        this._bounds.x = this.left - this._bounds.w;

    if (this.alignY == -1)
        this._bounds.y = this.top;
    else if (this.alignY == 0)
        this._bounds.y = this.top - this._bounds.h / 2;
    else if (this.alignY == 1)
        this._bounds.y = this.top - this._bounds.h;
}
;

// Inherited objects may need to override this
TextRenderable.prototype.deltaResize = function (dw, dh) {
    // No resizing texts, the size is defined by the font, font size, etc
    return {
        dw: 0.0,
        dh: 0.0
    };
};

TextRenderable.prototype.typeName = function () {
    return "Text";
};

TextRenderable.prototype.toString = function () {
    var str = this.parent.toString.call(this);
    str += "\n" + this.text;
    return str;
};

// ---------------
// Text specific functions

TextRenderable.prototype.setText = function (text) {
    this.text = text;
};

TextRenderable.prototype._validate = function () {
    var changeRequired = false;
    return changeRequired;
};

// ============================================================================
// Image

function ImageRenderable(x, y) {
    this._tupleType = 'canvas.renderable.image';
    this.type = Renderable.IMAGE;

    this.left = x || 0;
    this.top = y || 0;
    this.width = null;
    this.height = null;
    this.keepAspectRatio = false;
    this.rotation = 0;
    this.alpha = 0.0;
    this.image = null; // ID of image object
    this.lineColor = null;
    this.lineSize = 1;

    this._fields = this._fields.concat(['left', 'top', 'width', 'height',
        'keepAspectRatio', 'rotation', 'alpha', 'image', 'lineColor',
        'lineSize']);

    this._addins = [];

    this._bounds = new Bounds();

    this._validate();
}
ImageRenderable.inheritsFrom(Renderable);
registerTupleType(ImageRenderable);

ImageRenderable.prototype.draw = function (ctx) {
    this._bounds.x = this.left;
    this._bounds.y = this.top;

    // Get the image from the cache
    if (this.image)
        var imgObj = editorImageCache.image(this.image);

    if (imgObj) {
        // Update the bounds
        this._bounds.w = this.width || imgObj.width;
        if (this.keepAspectRatio) {
            this._bounds.h = this._bounds.w * imgObj.height / imgObj.width;
            this.height = this._bounds.h;
            this.width = this._bounds.w;
        } else {
            this._bounds.h = this.height || imgObj.height;
        }

    } else { // Else if our image is null
        var b = this._bounds;
        b.w = this.width || 50;
        b.h = this.height || 50;
    }

    ctx.save();
    ctx.translate(this.left,
            this.top);
    ctx.rotate(this.rotation * Math.PI / 180); // Degrees to radians

    // Translated coordinates
    var tx = 0;
    var ty = 0;
    var tw = this._bounds.w;
    var th = this._bounds.h;

    if (imgObj) {

        // Draw the image
        ctx.drawImage(imgObj,
                tx, // LEFT
                ty, // TOP
                tw,
                th);

    } else { // Else if our image is null
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + tw, ty + th);
        ctx.moveTo(tx + tw, ty);
        ctx.lineTo(tx, ty + th);
        ctx.rect(tx, ty, tw, th);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw border if configured
    if (this.lineColor) {
        ctx.beginPath();
        ctx.rect(tx, ty, tw, th);
        ctx.closePath();
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineSize;
        ctx.stroke();
    }

    ctx.restore();
};

// Inherited objects may need to override this
ImageRenderable.prototype.deltaResize = function (dw, dh) {
    if (typeof this.width != 'number')
        this.width = this._bounds.w;
    if (typeof this.height != 'number')
        this.height = this._bounds.h;
    if (this.width <= -dw)
        dw = 0;
    if (this.height <= -dh)
        dh = 0;

    if (this.keepAspectRatio) {
        // Always change the width
        // if (dw == 0) {
        // var b = this._bounds;
        // dw = b.w - (b.w / b.h) * (b.h += dh);
        // }
        dh = 0;
    }

    this.width += dw;
    this.height += dh;

    return {
        dw: dw,
        dh: dh
    };
};

ImageRenderable.prototype.typeName = function () {
    return "Image";
};

// ---------------
// Image specific functions

ImageRenderable.prototype._validate = function () {
    var changeRequired = false;
    return changeRequired;
};

