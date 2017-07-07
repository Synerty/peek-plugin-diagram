// ============================================================================
// Editor Ui Tools

/* This class manages the currently selected tool
 * 
 */
function Tools(editorUi) {
	this.editorUi = editorUi;

	this.tools = [];
	this.tools.push(this.TOOL_SELECT);
	this.tools.push(this.TOOL_TEXT);
	this.tools.push(this.TOOL_RECTANGLE);
	this.tools.push(this.TOOL_POLY);
	this.tools.push(this.TOOL_OVAL);
	this.tools.push(this.TOOL_IMAGE);

	// Select the initial tool
	var this_ = this;
	bodyLoader.add(function() {
		this_.selectSelector();
	});
}

Tools.prototype.TOOL_SELECT = "tbSelect";
Tools.prototype.TOOL_TEXT = "tbText";
Tools.prototype.TOOL_RECTANGLE = "tbRectangle";
Tools.prototype.TOOL_POLY = "tbPoly";
Tools.prototype.TOOL_OVAL = "tbOval";
Tools.prototype.TOOL_IMAGE = "tbImage";

Tools.prototype._select = function(tool) {
	this.tool = tool;
	this.editorUi.canvasMouse.setTool(tool);

	for ( var i = 0; i < this.tools.length; ++i) {
        var t = this.tools[i];
        var o = document.getElementById(t);
		document.getElementById(this.tools[i]).className = "";
	}

	document.getElementById(tool).className = "selected";
}

Tools.prototype.selectSelector = function() {
	this._select(this.TOOL_SELECT);
};

Tools.prototype.selectText = function() {
	this._select(this.TOOL_TEXT);
};

Tools.prototype.selectRectangle = function() {
	this._select(this.TOOL_RECTANGLE);
};

Tools.prototype.selectPoly = function() {
	this._select(this.TOOL_POLY);
};

Tools.prototype.selectOval = function() {
	this._select(this.TOOL_OVAL);
};

Tools.prototype.selectImage = function() {
	this._select(this.TOOL_IMAGE);
};
// ============================================================================
// Editor Ui Templates

/*
 * This class manages the currently selected tool
 * 
 */

function EditorGrid(editorUi) {
	this.editorUi = editorUi;
	this._elementGridSize = document.getElementById("tbGridSize");
	this._elementGridShow = document.getElementById("tbGridShow");
	this._elementGridSnapSize = document.getElementById("tbGridSnapSize");
	this._elementGridSnapping = document.getElementById("tbGridSnapping");
}

EditorGrid.prototype.changed = function() {
	editorRenderer.invalidate();
}

EditorGrid.prototype.size = function() {
	return parseInt(this._elementGridSize.value);
}

EditorGrid.prototype.show = function() {
	return this._elementGridShow.checked;
}


EditorGrid.prototype.snapSize = function() {
	return parseInt(this._elementGridSnapSize.value);
}


EditorGrid.prototype.snapping = function() {
	return this._elementGridSnapping.checked;
}


// ============================================================================
// Editor Ui

/*
 * This class manages the currently selected tool
 * 
 */

function EditorUi(editorUi) {
	this.tool = new Tools(this);
	this.canvasMouse = new CanvasMouse(this);
	this.grid = new EditorGrid(this);
	
	this._mainContentHideCssClass = 'mainContentHide';
	this._editorId = 'editor';
	this._manageImagesParentId = 'manageImagesParent';
	this._manageImageLoadUrl = '/ui/manage_images';
}

EditorUi.prototype.manageImages = function() {
	cssClassPush(this._editorId, this._mainContentHideCssClass);
	
	manageImages = new ManageImages();
	var manageImagesParent = document.getElementById(this._manageImagesParentId);
	cssClassPop(manageImagesParent, this._mainContentHideCssClass);
	
	
	new HtmlDocLoader(manageImagesParent,
			this._manageImageLoadUrl).run();
}

EditorUi.prototype.exitSegue = function() {
	cssClassPop(this._editorId, this._mainContentHideCssClass);

	var manageImagesParent = document.getElementById(this._manageImagesParentId);
	cssClassPush(manageImagesParent, this._mainContentHideCssClass);
	removeAllChildren(manageImagesParent);
	manageImages = null;

}

// ============================================================================
// Create editor instance

var editorUi = null;
var _editorUiInit = function() {
	editorUi = new EditorUi();
};