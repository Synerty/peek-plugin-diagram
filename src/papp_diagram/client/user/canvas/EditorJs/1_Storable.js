// Must align with constants in orm Renderable class
// Update types
UT_CREATE = 0;
UT_UPDATE = 1;
UT_DELETE = 2;

function Storable() {
	this.id = null;
	this._fields = [ 'id' ]

	this.__state = this.STORABLE_CREATED;
}
Storable.inheritsFrom(Tuple)

Storable.prototype.STORABLE_CREATED = UT_CREATE;
Storable.prototype.STORABLE_LOADED = UT_UPDATE;
Storable.prototype.STORABLE_DELETED = UT_DELETE;

/**
 * Create XML Doc
 * 
 * Creates an XML doc for this storable
 * 
 * @param xmlDoc :
 *            An optional xmlDoc to use instead of creating one
 * @param xmlTag :
 *            An optional parent tag to use instead of creating one. If xmlTag
 *            is specified, so must xmlDoc
 */
Storable.prototype.createXmlDoc = function(xmlDoc, xmlTag) {
	// creates a Document object with root "<report>"
	xmlDoc = xmlDoc || document.implementation.createDocument(null, null, null);
	//xmlTag = xmlAppendTag(xmlDoc, xmlTag || xmlDoc, this.tagName());
	//xmlTag.setAttribute('updateType', this.__state);
    //
	//for ( var i = 0; i < this._fields.length; ++i) {
	//	var fieldName = this._fields[i]; // Field Name
	//	var val = this["_" + fieldName];
	//	xmlAppendTagVal(xmlDoc, xmlTag, fieldName, val);
	//}

	return {
		doc : xmlDoc,
		tag : xmlTag
	};
}

Storable.prototype.createFromXml = function(xmlTag) {
	alert("Not implemented");
}

Storable.prototype.updateFromXml = function(xmlTag) {
	for ( var i = 0; i < this._fields.length; ++i) {
		var fieldName = this._fields[i]; // Field Name
		var val = xmlGetFirstTagValueStr(xmlTag, fieldName);

		// Value conversion
		if (val == 'true')
			val = true;
		else if (val == 'false')
			val = false;
		else if (val == parseFloat(val))
			val = parseFloat(val);

		this["_" + fieldName] = val;
	}

	this.__state = this.STORABLE_LOADED;
}

Storable.prototype.storeState = function(delete_) {
	if (this.id == null && this.__state != this.STORABLE_CREATED)
		return;

	if (delete_ == UT_DELETE)
		this.__state = this.STORABLE_DELETED;

	console.log("STORING DISABLED");
	// creates a Document object with root "<report>"
	//var data = this.createXmlDoc();
	//editorStorage.saveChange(data.doc);
}

Storable.prototype.clone = function() {
	var r = new this.constructor();
	for ( var i = 0; i < this._fields.length; ++i) {
		var field = "_" + this._fields[i];
		r[field] = this[field];
	}
	r.id = null;
	r.__state == this.STORABLE_CREATED;
	return r;
}

Storable.prototype.deleted = function() {
	return this.__state == this.STORABLE_DELETED;
}

Storable.prototype.tagName = function() {
	alert("Not implemented");
}
