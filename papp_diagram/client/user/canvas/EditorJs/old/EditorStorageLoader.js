/*! loader
 * Retrieves xml given a URL and parameters 
 * 
 */
function EditorStorageLoader(dataUrl) {
	this._dataUrl = dataUrl;
};

EditorStorageLoader.prototype.reload = function(filter) {
	this.load(filter);
}

EditorStorageLoader.prototype.load = function(filter) {
	var this_ = this; // For closure

	var filtStr = getFiltStr(filter);

	var xmlhttp = httpRequest();
	xmlhttp.open("GET", this._dataUrl + filtStr, true);
	xmlhttp.onreadystatechange = function() {
		this_._loadCallback(xmlhttp)
	};
    // DON'T SEND, DISABLED, DEBUG DEBUG
	//xmlhttp.send();
}

EditorStorageLoader.prototype._loadCallback = function(xmlhttp) {
	if (xmlhttp.readyState != 4)
		return;
	if (xmlhttp.status != 200) {
		// this.loadingUpdator.state = -1; // Turn off loading progress
		return;
	}

	this.loadResponseXml(xmlhttp);
};

// Class method
EditorStorageLoader.prototype.loadResponseXml = function(xmlhttp) {
	// Get the XML document
	var xmlDoc = xmlhttp.responseXML;
	var xmlRoot = xmlDoc.firstChild;

	var renderables = [];
	var pageGroups = [];
	var pages = [];
	var layers = [];

	var currentPage = editorPage.currentPageId();

	for ( var i = 0; i < xmlRoot.childNodes.length; ++i) {
		var xmlNode = xmlRoot.childNodes[i];
		if (xmlNode.tagName == Renderable.TAG_NAME) {
			var id = xmlGetChildrenByTag(xmlNode, 'id')[0].firstChild.nodeValue;
			var page = xmlGetChildrenByTag(xmlNode, 'page')[0].firstChild.nodeValue;

			if (page != currentPage)
				continue;

			var renderable = editorModel.renderableById(id);
			if (renderable)
				renderable.updateFromXml(xmlNode);
			else
				renderables.push(Renderable.prototype.createFromXml(xmlNode))
				
		} else if (xmlNode.tagName == PageGroupStorable.TAG_NAME) {
			pageGroups.push(PageGroupStorable.prototype.createFromXml(xmlNode));
			
		} else if (xmlNode.tagName == PageStorable.TAG_NAME) {
			pages.push(PageStorable.prototype.createFromXml(xmlNode));
			
		} else if (xmlNode.tagName == LayerStorable.TAG_NAME) {
			layers.push(LayerStorable.prototype.createFromXml(xmlNode));
			
		}
	}

	if (renderables.length)
		editorModel.addRenderable(renderables);
	else // Sorting is done when a renderable is added
		editorModel.sortRenderables();

	if (pageGroups.length)
		editorPageGroup.addPageGroup(pageGroups);
	if (pages.length)
		editorPage.addPage(pages);
	if (layers.length)
		editorLayer.addLayer(layers);

	editorRenderer.invalidate();
};
