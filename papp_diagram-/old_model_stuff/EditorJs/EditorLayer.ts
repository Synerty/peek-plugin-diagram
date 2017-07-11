// Editor Layers

/*
 * This class manages the layers
 * 
 */

function LayerStorable(name) {
    this._tupleType = 'canvas.layer';
    this.name = name;
    this.order = 0;
    this.selectable = true;
    this.visible = true;
    this.color = 'black';
    this._fields = this._fields.concat(['name', 'order', 'selectable', 'visible','color']);
}
LayerStorable.inheritsFrom(Storable);
registerTupleType(LayerStorable)


LayerStorable.prototype.createFromXml = function (xmlTag) {
    var layer = new LayerStorable();
    layer.updateFromXml(xmlTag);
    return layer
}

LayerStorable.prototype.tagName = function () {
    return LayerStorable.TAG_NAME;
}

LayerStorable.prototype.order = function () {
    return this.order;
}

LayerStorable.prototype.setName = function (name) {
    this.name = name;
    this.storeState();
}

LayerStorable.prototype.optionElement = function () {
    return new Option(this.name, this.id);
}

// ============================================================================

/*
 * This class manages the layers
 * 
 */

function EditorLayer() {
    this._layers = [];
    this._layersById = new StorableDict();
    this._currentLayerId = null;

}


EditorLayer.prototype.setLayers = function (layers) {
    var self = this;
    self._layers = layers;
    self._layersById = new StorableDict();
    self._layersById.add(layers);
}


EditorLayer.prototype.selectedLayers = function () {
    var self = this;

    var layers = [];
    for (var i = 0; i < self._layers.length; ++i) {
        var layer = self._layers[i];
        if (layer.selectable)
            layers.push(layer);
    }
    return layers;
}

EditorLayer.prototype.checkedLayers = function () {
    var self = this;

    var layers = [];
    for (var i = 0; i < self._layers.length; ++i) {
        var layer = self._layers[i];
        if (layer.visible)
            layers.push(layer);
    }
    return layers;
};

EditorLayer.prototype.lastLayer = function () {
    if (this._layers.length)
        return this._layers[this._layers.length - 1];
    else
        return null;
};

EditorLayer.prototype.layerById = function (id) {
    return this._layersById[id];
};

EditorLayer.prototype.create = function () {
    var name = prompt("Please enter the new layerId name");
    if (name == null || name == "")
        return;

    var newLayer = new LayerStorable(name);
    newLayer.storeState();
}

EditorLayer.prototype.itemCheckChanged = function () {
    editorRenderer.invalidate();
}

// EditorLayer.prototype.select = function(id) {
// this._currentLayerId = id;
// this._loadLayer();
// }

EditorLayer.prototype.addLayer = function (objOrArray) {
    //this._layersById.add(objOrArray);
    //this._layers.add(objOrArray);
    //
    //// Refresh layers
    //var manager = getElem(this._dynListBoxId).manager;
    //if (objOrArray instanceof Array) {
    //    for (var i = 0; i < objOrArray.length; ++i)
    //        manager.addItem(objOrArray[i].optionElement());
    //
    //} else {
    //    manager.addItem(objOrArray.optionElement());
    //}
}

// ============================================================================
// Create editor model instance

var editorLayer = null;
var _editorLayerInit = function () {
    editorLayer = new EditorLayer();
};