// Editor Pages

/*
 * This class manages the currently selected tool
 * 
 */

function PagesUi(editorUi) {
	this.editorUi = editorUi;
	this._element = null;
	this._swipeLeftSelect = getElem('pagePropSwipeLeft');
	this._swipeRightSelect = getElem('pagePropSwipeRight');
}

PagesUi.prototype.addClicked = function() {
	var name = prompt("Please enter the name of the new page");
	if (name == null || name == "")
		return;
	editorPage.create(name);

}

PagesUi.prototype.delClicked = function() {
	var id = this._element.getValue();
	if (id)
		editorPage.removePage(id);
}

PagesUi.prototype.editClicked = function() {
}

PagesUi.prototype.propSaveClicked = function() {
	var page = editorPage.currentPage();
	if (page === undefined)
		return;

	var lval = $(this._swipeLeftSelect).val();
	var rval = $(this._swipeRightSelect).val();

	page._swipeLeftPage = lval == 'null' ? null : lval;
	page._swipeRightPage = rval == 'null' ? null : rval;
	page.storeState();
}

PagesUi.prototype.itemSelected = function(evt) {
	var id = this._element.getValue();
	if (id)
		editorPage.select(id);
}

PagesUi.prototype.select = function(value) {
	var sel = this._element;
	$('#{0}'.format(sel.id)).val(value);
	editorUi.tool.selectSelector();
	this._updateSwipeSelects();
}

PagesUi.prototype.addPage = function(objOrArray) {
	if (objOrArray instanceof Array) {
		for ( var i = 0; i < objOrArray.length; ++i) {
			this._addOrUpdatePage(objOrArray[i])
		}
	} else {
		this._addOrUpdatePage(objOrArray)
	}

	this._updateSwipeSelects();
}

PagesUi.prototype._addOrUpdatePage = function(page) {
	var sel = this._element;

	var existingOption = $(sel).find("option[value='" + page.id + "']");
	if (existingOption.length) {
		existingOption.text(page.name)
	} else {
		sel.options[sel.options.length] = page.optionElement();
	}
}

PagesUi.prototype.removePage = function(value) {
	var values = value;
	if (!values instanceof Array) {
		values = [ value ]
	}

	var sel = this._element;
	for ( var i = 0; i < values.length; ++i) {
		var value = values[i];
		$('#{0} option[value="{1}"]'.format(sel.id, value)).remove();
	}

	this._updateSwipeSelects();
}

PagesUi.prototype.removeAll = function() {
	$(this._element).empty();
	this._updateSwipeSelects();
}

PagesUi.prototype._updateSwipeSelects = function() {
	var html = "<option value='null'/>" + $(this._element).html();
	$(this._swipeLeftSelect).html(html);
	$(this._swipeRightSelect).html(html);

	var page = editorPage.currentPage();
	if (page) {
		$(this._swipeLeftSelect).val(page._swipeLeftPage);
		$(this._swipeRightSelect).val(page._swipeRightPage);
	}

}

PagesUi.prototype.setElement = function(element) {
	this._element = element;
}

// ============================================================================

/*
 * This class manages the pages
 * 
 */

function PageStorable(name) {
	this.name = name;
	this._comment = null;
	this._pageGroup = null;
	this._swipeLeftPage = null;
	this._swipeRightPage = null;
	this._fields = this._fields.concat([ 'name', 'comment', 'pageGroup',
			'swipeLeftPage', 'swipeRightPage' ]);
}
PageStorable.inheritsFrom(Storable);

PageStorable.TAG_NAME = 'page';

PageStorable.prototype.createFromXml = function(xmlTag) {
	var page = new PageStorable();
	page.updateFromXml(xmlTag);
	return page
}

PageStorable.prototype.tagName = function() {
	return PageStorable.TAG_NAME;
}

PageStorable.prototype.setName = function(name) {
	this.name = name;
	this.storeState();
}

PageStorable.prototype.optionElement = function() {
	return new Option(this.name, this.id);
}

// ============================================================================

/*
 * This class manages the pages
 * 
 */

function EditorPage() {
	this._pages = [];
	this._pagesById = new StorableDict();
	this._currentPageId = null;
}

EditorPage.prototype.currentPageId = function() {
	return this._currentPageId;
}

EditorPage.prototype.currentPage = function() {
	return this._pagesById[this._currentPageId];
}

EditorPage.prototype.create = function(pageName) {
	var newPage = new PageStorable(pageName);
	newPage._pageGroup = editorPageGroup.currentPageGroupId();
	newPage.storeState();
}

EditorPage.prototype.select = function(id) {
	this._currentPageId = id;
	editorUi.pages.select(id);
	this._loadPage();
}

EditorPage.prototype.addPage = function(objOrArray) {
	this._pages.add(objOrArray);
	this._pagesById.add(objOrArray);

	// Refresh pages
	editorUi.pages.addPage(objOrArray);
	if (this._currentPageId == null && this._pages.length)
		this.select(this._pages[0].id);
}

EditorPage.prototype.edit = function() {
}

EditorPage.prototype.removePage = function(id) {
	if (this._pages.length == 1) {
		usrMsgDispatcher
				.logError("Can not remove the only page, create another first");
		return;
	}

	var page = this._pagesById[id];
	page.storeState(UT_DELETE);
	delete this._pagesById[id];
	this._pages = this._pagesById.toArray();
	editorUi.pages.removePage(id);

	if (this._currentPageId == id)
		this.select(this._pages[0]);
}

EditorPage.prototype.setElement = function(element) {
	this._element = element;
}

EditorPage.prototype._loadPage = function() {
	editorModel.clearRenderables();
	editorStorage.loadRenderables(this._currentPageId);
}

EditorPage.prototype.clearPages = function() {
	editorModel.clearRenderables();
	editorUi.pages.removeAll();

	this._pages = [];
	this._pagesById = new StorableDict();
	this._currentPageId = null;
}

// ============================================================================
// Create editor model instance

var editorPage = null;
var _editorPageInit = function() {
	editorPage = new EditorPage();
};