// ============================================================================
// Editor Model

/**
 * Editor Model This class manages the data manipulation Its the model
 * 
 */
function EditorStorage() {
	this._dataUrl = "/data/editor/storage";
	this._loader = new EditorStorageLoader(this._dataUrl);
	this._submitter = new EditorStorageSubmitter(this._dataUrl);

	this.loadPageGroups();
	this.loadPages();
	this.loadLayers();
}

EditorStorage.prototype.saveChange = function(objectName, id) {
	this._submitter.pushChange(change);
}

EditorStorage.prototype.loadPageGroups = function() {
	var filter = {
		objectType : PageGroupStorable.TAG_NAME
	};
	this._loader.load(filter);
}

EditorStorage.prototype.loadPages = function(pageGroupId) {
	var filter = {
		objectType : PageStorable.TAG_NAME,
		pageGroupId : pageGroupId
	};
	this._loader.load(filter);
}

EditorStorage.prototype.loadLayers = function() {
	var filter = {
		objectType : LayerStorable.TAG_NAME
	};
	this._loader.load(filter);
}

EditorStorage.prototype.loadRenderables = function(pageId) {
	var filter = {
		objectType : Renderable.TAG_NAME,
		pageId : pageId
	};
	this._loader.load(filter);
}

EditorStorage.prototype.reload = function(storable) {
	var filter = {
		objectType : storable.tagName(),
		id : storable.id
	};
	reloader = new EditorStorageLoader(this._dataUrl);
	reloader.reload(filter, [ storable ]);
}

EditorStorage.prototype.saveChange = function(change) {
	this._submitter.pushChange(change);
}

// ============================================================================
// Create editor model instance

var editorStorage = null;
var _editorStorageInit = function() {
	editorStorage = new EditorStorage();
};