/**
 * Editor Inspector This class is responsible for displaying the inspector and
 * properties for the currently selected object
 */

function EditorInspector() {
	this._inspectorPanelInner = null;
	this._selectionList = null;
	this._selectionListLastMouseDownEventShiftOrCtrl = null;
	this._inspectorPanel = null;
	this._addinSelectElement = null;
	this._selectedItem = null;
	this._formControlDivs = []
	this._htmlDocUrl = '/ui/inspector';
	this._addinUrl = '/data/inspector/addin';
	this._htmlDocLoader = null;
	this._lastHoveredItem = null;

	var this_ = this;
	bodyLoader.add(function() {
		editorRenderer.drawEvent.add(function(ctx) {
			this_.draw(ctx);
		});
	});
	
	this._effect = '';

}

EditorInspector.prototype._reset = function() {
    return;


	this._selectedItem = null;
	this._formControlDivs = []
	$("#" + this._inspectorPanel.id).hide(this._effect);
	$("#" + this._selectionList.id).hide(this._effect);
	this._selectionList.manager.clearItems();
	this._htmlDocLoader = null;
	if (this._addinSelectElement)
		this._addinSelectElement.selectedIndex = -1;
	this._selectionListLastMouseDownEventShiftOrCtrl = null;
	this._lastHoveredItem = null;
}

EditorInspector.prototype.setInspectorPanelInner = function(element) {
	this._inspectorPanelInner = element;
}

EditorInspector.prototype.setInspectorPanel = function(element) {
	this._inspectorPanel = element;
	$("#" + this._inspectorPanel.id).hide();
}

EditorInspector.prototype.setAddinSelectElement = function(element) {
	this._addinSelectElement = element;
}

// TODO, This is a hack, what we really need is an observer model
EditorInspector.prototype.storablesUpdated = function(storables) {
	if (this._selectedItem == null)
		return;

	for ( var i = 0; i < storables.length; ++i) {
		if (this._selectedItem == storables[i]) {
			this._runFormLoaders();
			return;
		}
	}
}

EditorInspector.prototype.selectionChanged = function(deleted) {
    return;


	if (this._selectedItem && !this._selectedItem.deleted())
		this.saveClicked();

	var selection = editorModel.selectedRenderables();
	this._reset();

	if (selection.length == 1) {
		this._selectedItem = selection[0];
		this._load();
	} else {
		this._loadSelectionList(selection);
	}

}

EditorInspector.prototype.saveClicked = function() {
	this._runFormSubmitters()
}

EditorInspector.prototype.revertClicked = function() {
	this._runFormLoaders();
	editorStorage.reload(this._selectedItem);
}

EditorInspector.prototype._load = function() {
	removeAllChildren(this._inspectorPanelInner);

	if (!this._selectedItem)
		return;

	var str = "Item selected ID=" + this._selectedItem.id + " Type="
			+ this._selectedItem.type;
	appendTextNode(this._inspectorPanelInner, str);

	var filter = {
		id : this._selectedItem.id
	};

	var this_ = this;
	var callback = function(xmlhttp) {
		this_._loadCallback(xmlhttp)
	};

	this._htmlDocLoader = new HtmlDocLoader(this._inspectorPanelInner,
			this._htmlDocUrl, callback, filter);
	this._htmlDocLoader.run();
};

EditorInspector.prototype._loadCallback = function(xmlhttp) {
	/*
	 * Some times there is a double click event, if that occurs we will have
	 * recieved this callback because we sent an async request between the
	 * mouseup for the first event and the mousedblclick event. Check for this
	 * condition.
	 */
	if (this._selectedItem == null)
		return;
	this._runFormLoaders();
	$("#" + this._inspectorPanel.id).show(this._effect);
};

// -----------------
// Selection List related code

EditorInspector.prototype.setSelectionList = function(element) {
    return;


	this._selectionList = element;
	$("#" + this._selectionList.id).hide();
}

EditorInspector.prototype._loadSelectionList = function(selection) {
	var manager = this._selectionList.manager;
	for ( var i = 0; i < selection.length; ++i) {
		var r = selection[i];
		manager.addItem(r.toString(), r.id);
	}

	if (selection.length)
		$("#" + this._selectionList.id).show(this._effect);
};

EditorInspector.prototype.selectionListMouseDown = function(event) {
	this._selectionListLastMouseDownEventShiftOrCtrl = event.shiftKey
			|| event.ctrlKey;
}

EditorInspector.prototype.selectionListChanged = function(id) {
	if (!id) // Top entry has no attribute named "value"
		return;

	var selectedRenderable = editorModel.renderableById(parseInt(id))
	if (selectedRenderable) {
		if (this._selectionListLastMouseDownEventShiftOrCtrl) {
			editorModel.removeSelection(selectedRenderable);
		} else {
			editorModel.clearSelection();
			editorModel.addSelection(selectedRenderable);
		}
	}
	this._selectionListLastMouseDownEventShiftOrCtrl = false;
}

EditorInspector.prototype.selectionListItemHover = function(item) {
	this._lastHoveredItem = editorModel.renderableById(item);
	editorRenderer.invalidate();
}

EditorInspector.prototype.draw = function(ctx) {
	if (!this._lastHoveredItem)
		return;

	var b = this._lastHoveredItem.bounds();
	ctx.beginPath();
	ctx.rect(b.x, b.y, b.w, b.h);
	ctx.closePath();

	ctx.strokeStyle = 'blue';
	ctx.lineWidth = 3;
	ctx.stroke();

}

// -----------------
// Form loader / submitter related code

EditorInspector.prototype.addFormControlElement = function(element) {
	this._formControlDivs.push(element);
}

EditorInspector.prototype._runFormLoaders = function() {
	var formControlDivs = this._getFormControlDivs();
	for ( var i = 0; i < formControlDivs.length; ++i) {
		formControlDivs[i].loader.run();
	}
}

EditorInspector.prototype._runFormSubmitters = function() {
	var renderableReloaded = false;
	var selectedItem = this._selectedItem;
	var userCallback = function(){
		// Reload the renderable once the first submitter has returned
		// TODO We really want to wait until the last has returned :-(
		// Where are javascript deferred lists when you need them
		if (renderableReloaded)
			return;
		editorStorage.reload(selectedItem);
		renderableReloaded = true;
	};
	
	var dataSubmitted = false;
	var formControlDivs = this._getFormControlDivs();
	for ( var i = 0; i < formControlDivs.length; ++i) {
		dataSubmitted |= formControlDivs[i].submitter.run(userCallback);
	}
	return dataSubmitted;
}

EditorInspector.prototype._getFormControlDivs = function() {
	var i = 0;
	while (i < this._formControlDivs.length) {
		var formControlDiv = this._formControlDivs[i];
		if (!document.getElementById(formControlDiv.id))
			this._formControlDivs.splice(i, 1)
		else
			++i
	}
	return this._formControlDivs;
};

// -----------------
// Addin related code

EditorInspector.prototype.addAddinClicked = function() {
	var id = this._addinSelectElement.getValue();
	if (!id) // Top entry has no attribute named "value"
		return;
	var addinType = parseInt(id);

	this._createAddin(addinType)
}

EditorInspector.prototype._createAddin = function(addinType) {
	var filter = {
		renderableId : this._selectedItem.id,
		addinType : addinType
	};

	var this_ = this; // For closure
	var xmlhttp = httpRequest();
	var filtStr = getFiltStr(filter);
	xmlhttp.open("POST", this._addinUrl + filtStr, true);
	xmlhttp.onreadystatechange = function() {
		this_._createAddinCallback(xmlhttp)
	};
	xmlhttp.send();
}

EditorInspector.prototype._createAddinCallback = function(xmlhttp) {
	if (xmlhttp.readyState != 4)
		return;
	if (xmlhttp.status != 200) {
		USG_MSG_DISPATCHER.logError("Failed to create addin");
		return;
	}

	editorStorage.reload(this._selectedItem);
	this._load();
}

EditorInspector.prototype.deleteAddinsClicked = function() {
	if (!this._selectedItem)
		return;
	
	this._deleteAddins()
}

EditorInspector.prototype._deleteAddins = function() {
	var filter = {
		renderableId : this._selectedItem.id,
		addinType : null,
		deleteAddins : true
	};

	var this_ = this; // For closure
	var xmlhttp = httpRequest();
	var filtStr = getFiltStr(filter);
	xmlhttp.open("POST", this._addinUrl + filtStr, true);
	xmlhttp.onreadystatechange = function() {
		this_._deleteAddinsCallback(xmlhttp)
	};
	xmlhttp.send();
}

EditorInspector.prototype._deleteAddinsCallback = function(xmlhttp) {
	if (xmlhttp.readyState != 4)
		return;
	if (xmlhttp.status != 200) {
		USG_MSG_DISPATCHER.logError("Failed to delete addins");
		return;
	}

	editorStorage.reload(this._selectedItem);
	this._load();
}

// ============================================================================
// Create editor Inspector instance

var editorInspector = null;
var _editorInspectorInit = function() {
	editorInspector = new EditorInspector();
};