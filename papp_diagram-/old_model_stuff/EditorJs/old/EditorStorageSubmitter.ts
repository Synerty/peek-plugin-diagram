/*! submitter
 * Collects data from an element, and http_post's to a url
 * 
 * ... is a 2 dimenssional Array, where each row consists of 
 * 	   a set of parameters needed to submit something.
 * 	   in the format: Array(http_post_url,http_post_params)
 */
function EditorStorageSubmitter(dataUrl) {
	this._dataUrl = dataUrl;
	this._changeQueue = [];
	this._submitting = false;
};

EditorStorageSubmitter.prototype.pushChange = function(change) {
    // TODO, Storage disabled.
	//if (change instanceof Array)
	//	this._changeQueue.concat(change);
	//else
	//	this._changeQueue.push(change);
    //
	//if (!this._submitting)
	//	this._submit();
};

// Cycle through data for each
EditorStorageSubmitter.prototype._submit = function() {
	this._submitting = true;
	var this_ = this; // For closures
	var change = this._changeQueue[0];

	var xmlhttp = httpRequest();
	xmlhttp.open("POST", this._dataUrl, true);
	xmlhttp.onreadystatechange = function() {
		this_._submitCallback(xmlhttp)
	};

	xmlhttp.send(change);
};

EditorStorageSubmitter.prototype._submitCallback = function(xmlhttp) {
	if (xmlhttp.readyState != 4)
		return;
	if (xmlhttp.status != 200) {
		// TODO - Error checking
		alert("canvas object storage failed, xmlhttp.status=" + xmlhttp.status);
		return;
	}

	var change = this._changeQueue.shift();
	
	// We reload after an update
	if (xmlhttp.responseText != ''){
		EditorStorageLoader.prototype.loadResponseXml(xmlhttp);
	}

	if (!this._changeQueue.length)
		this._submitting = false;
	else
		this._submit();
};
