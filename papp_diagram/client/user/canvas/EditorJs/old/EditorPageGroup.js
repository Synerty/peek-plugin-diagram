// Editor PageGroups

/*
 * This class manages the currently selected tool
 * 
 */

function PageGroupsUi(editorUi) {
	this.editorUi = editorUi;
	this._element = null;
}

PageGroupsUi.prototype.addClicked = function() {
	var name = prompt("Please enter the name of the new pageGroup");
	if (name == null || name == "")
		return;
	editorPageGroup.create(name);
}

PageGroupsUi.prototype.delClicked = function() {
	var id = this._element.getValue();
	if (id)
		editorPageGroup.removePageGroup(id);
}

PageGroupsUi.prototype.editClicked = function() {
}

PageGroupsUi.prototype.itemSelected = function(evt) {
	var id = this._element.getValue();
	if (id)
		editorPageGroup.select(id);
}

PageGroupsUi.prototype.select = function(value) {
	var sel = this._element;
	$('#{0}'.format(sel.id)).val(value);
	editorUi.tool.selectSelector();
}

PageGroupsUi.prototype.addPageGroup = function(objOrArray) {
	var sel = this._element;
	if (objOrArray instanceof Array) {
		for ( var i = 0; i < objOrArray.length; ++i) {
			sel.options[sel.options.length] = objOrArray[i].optionElement();
		}
	} else {
		sel.options[sel.options.length] = objOrArray.optionElement();
	}

}

PageGroupsUi.prototype.removePageGroup = function(value) {
	var values = value;
	if (!values instanceof Array) {
		values = [ value ]
	}

	var sel = this._element;
	for ( var i = 0; i < values.length; ++i) {
		var value = values[i];
		$('#{0} option[value="{1}"]'.format(sel.id, value)).remove();
	}

}

PageGroupsUi.prototype.setElement = function(element) {
	this._element = element;
}

// ============================================================================

/*
 * This class manages the pageGroups
 * 
 */

function PageGroupStorable(name) {
	this.name = name;
	this._comment = null;
	this._fields = this._fields.concat([ 'name', 'comment' ]);
}
PageGroupStorable.inheritsFrom(Storable);

PageGroupStorable.TAG_NAME = 'pageGroup';

PageGroupStorable.prototype.createFromXml = function(xmlTag) {
	var pageGroup = new PageGroupStorable();
	pageGroup.updateFromXml(xmlTag);
	return pageGroup
}

PageGroupStorable.prototype.tagName = function() {
	return PageGroupStorable.TAG_NAME;
}

PageGroupStorable.prototype.setName = function(name) {
	this.name = name;
	this.storeState();
}

PageGroupStorable.prototype.optionElement = function() {
	return new Option(this.name, this.id);
}

// ============================================================================

/*
 * This class manages the pageGroups
 * 
 */

function EditorPageGroup() {
	this._pageGroups = [];
	this._pageGroupsById = new StorableDict();
	this._currentPageGroupId = null;
}

EditorPageGroup.prototype.currentPageGroupId = function() {
	return this._currentPageGroupId;
}

EditorPageGroup.prototype.create = function(pageGroupName) {
	var newPageGroup = new PageGroupStorable(pageGroupName);
	newPageGroup.storeState();
}

EditorPageGroup.prototype.select = function(id) {
	this._currentPageGroupId = id;
	editorUi.pageGroups.select(id);
	this._loadPageGroup();
}

EditorPageGroup.prototype.addPageGroup = function(objOrArray) {
	this._pageGroups.add(objOrArray);
	this._pageGroupsById.add(objOrArray);

	// Refresh pageGroups
	editorUi.pageGroups.addPageGroup(objOrArray);
	if (this._currentPageGroupId == null && this._pageGroups.length)
		this.select(this._pageGroups[0].id);
}

EditorPageGroup.prototype.edit = function() {
	usrMsgDispatcher
			.logError("Editing not implemented");
}

EditorPageGroup.prototype.removePageGroup = function(id) {
	if (this._pageGroups.length == 1) {
		usrMsgDispatcher
				.logError("Can not delete the only pageGroup, create another first");
		return;
	}

	var pageGroup = this._pageGroupsById[id];
	pageGroup.storeState(UT_DELETE);
	delete this._pageGroupsById[id];
	this._pageGroups = this._pageGroupsById.toArray();
	editorUi.pageGroups.removePageGroup(id);

	if (this._currentPageGroupId == id)
		this.select(this._pageGroups[0]);
}

EditorPageGroup.prototype.setElement = function(element) {
	this._element = element;
}

EditorPageGroup.prototype._loadPageGroup = function() {
	editorPage.clearPages();
	editorStorage.loadPages(this._currentPageGroupId)
}

// ============================================================================
// Create editor model instance

var editorPageGroup = null;
var _editorPageGroupInit = function() {
	editorPageGroup = new EditorPageGroup();
};