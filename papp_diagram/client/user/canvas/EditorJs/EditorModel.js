// ============================================================================
// Editor Model

/**
 * Editor Model This class manages the data manipulation Its the model
 * 
 */
function EditorModel() {
	this._selection = []; // The currently selected renderables
	this._renderables = []; // Objects to be drawn on the display
	this._renderablesById = new StorableDict(); // Objects to be drawn on the

    this._scope = null;
	// display
}

EditorModel.prototype.setScope = function (scope) {
    this._scope = scope;
};

EditorModel.prototype.renderables = function() {
	return this._renderables;
}

EditorModel.prototype.renderableById = function(id) {
	if (this._renderablesById.hasOwnProperty(id))
		return this._renderablesById[id];
	return null;
}

EditorModel.prototype.selectedRenderables = function() {
	return this._selection;
}

EditorModel.prototype.addRenderable = function(objectOrArray) {
	this._renderables = this._renderables.add(objectOrArray);
	this._renderablesById.add(objectOrArray);
	this.sortRenderables();
	editorRenderer.invalidate();
}

EditorModel.prototype.removeRenderable = function(objectOrArray) {
	this._renderables = this._renderables.remove(objectOrArray);
	this._renderablesById.remove(objectOrArray);
	this.removeSelection(objectOrArray); // Invalidates in this function
}

EditorModel.prototype.deleteRenderable = function(objectOrArray) {
	if (objectOrArray instanceof Array) {
		objectOrArray.filter(function(o) {
			o.storeState(UT_DELETE);
		});
	} else {
		objectOrArray.storeState(UT_DELETE);
	}

	this.removeRenderable(objectOrArray);
}

EditorModel.prototype.clearRenderables = function() {
	this._renderables = [];
	this._renderablesById = new StorableDict();
	this.clearSelection();
}

EditorModel.prototype.addSelection = function(objectOrArray, applyScope) {
	this._selection = this._selection.add(objectOrArray);
	editorRenderer.invalidate();
    if (this._scope && applyScope !== false)
        this._scope.$apply();
}

EditorModel.prototype.removeSelection = function(objectOrArray, applyScope) {
	this._selection = this._selection.remove(objectOrArray);
	editorRenderer.invalidate();
    if (this._scope && applyScope !== false)
        this._scope.$apply();
}

EditorModel.prototype.clearSelection = function(applyScope) {
	this._selection = [];
	editorRenderer.invalidate();
    if (this._scope && applyScope !== false)
        this._scope.$apply();
}

EditorModel.prototype.renderablesAvailibleForSelection = function() {
	var checkedLayers = editorLayer.checkedLayers();
	var selectedLayers = editorLayer.selectedLayers();
	var selectedLayersDict = null;

	if (selectedLayers.length) {
		if (checkedLayers.length)
			selectedLayers = selectedLayers.intersect(checkedLayers);

		selectedLayersDict = new StorableDict().add(selectedLayers);

	} else if (checkedLayers.length) {
		selectedLayersDict = new StorableDict().add(checkedLayers);

	} else {
		return this._renderables.slice(0);

	}

	return this._renderables.filter(function(i) {
		return selectedLayersDict.hasOwnProperty(i.layerId);
	});
};

EditorModel.prototype.sortRenderables = function() {
	var sortFunc = function(o1, o2) {
		//var l1 = editorLayer.layerById(o1.layerId);
		//var l2 = editorLayer.layerById(o2.layerId);
		//if (l1.order() != l2.order())
		//	return l1.order() - l2.order();
		return o1.zorder - o2.zorder;
	}
	this._renderables.sort(sortFunc);
}

// ============================================================================
// Create editor model instance

var editorModel = null;
var _editorModelInit = function() {
	editorModel = new EditorModel();
};