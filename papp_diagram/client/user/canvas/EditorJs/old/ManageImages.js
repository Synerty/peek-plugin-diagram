//// ============================================================================
//
///*
// * This class manages the pages
// * 
// */
//
//function ImageStorable() {
//	this.name = null;
//}
//ImageStorable.inheritsFrom(Storable);
//
//ImageStorable.TAG_NAME = 'page';
//
//ImageStorable.prototype.createXmlDoc = function() {
//	data = this.parent.createXmlDoc.call(this);
//	xmlAppendTagVal(data.doc, data.tag, "name", this.name);
//	return data;
//}
//
//ImageStorable.prototype.createFromXml = function(xmlTag) {
//	var page = new ImageStorable();
//	page.updateFromXml(xmlTag);
//	return page
//}
//
//ImageStorable.prototype.updateFromXml = function(xmlTag) {
//	this.parent.updateFromXml.call(this, xmlTag);
//	this.name = xmlGetFirstTagValueStr(xmlTag, "name");
//}
//
//ImageStorable.prototype.tagName = function() {
//	return ImageStorable.TAG_NAME;
//}
//
//ImageStorable.prototype.setName = function(name) {
//	this.name = name;
//	this.storeState();
//}
//
//ImageStorable.prototype.optionElement = function() {
//	return new Option(this.name, this.id);
//}
//
//// ============================================================================
//
///*
// * This class manages the pages
// * 
// */
//
//function ManageImage() {
//	this._pages = [];
//	this._currentImageId = null;
//}
//
//ManageImage.prototype.currentImageId = function() {
//	return this._currentImageId;
//}
//
//ManageImage.prototype.create = function(pageName) {
//	var newImage = new ImageStorable();
//	newImage.setName(pageName);
//	newImage.storeState();
//}
//
//ManageImage.prototype.select = function(id) {
//	this._currentImageId = id;
//	this._loadImage();
//}
//
//ManageImage.prototype.addImage = function(objOrArray) {
//	if (objOrArray instanceof Array)
//		this._pages.concat(objOrArray);
//	else
//		this._pages.push(objOrArray);
//
//	// Refresh pages
//	manageUi.pages.addImage(objOrArray);
//}
//
//ManageImage.prototype.edit = function() {
//}
//
//ManageImage.prototype.removeImage = function() {
//}
//
//ManageImage.prototype.setElement = function(element) {
//	this._element = element;
//}
//
//ManageImage.prototype._loadImage = function() {
//	manageModel.clearRenderables();
//	manageStorage.loadRenderables(this._currentImageId);
//}
//

// TODO Fix this up, its a quick hack
function manageImagesFormElements() {
	return {
		idElement : document.getElementById('miSubmitId'),
		dataElement : document.getElementById('miSubmitData'),
		nameElement : document.getElementById('miSubmitName'),
		commentElement : document.getElementById('miSubmitComment')
	};
}

// ============================================================================
// Manage Images Ui Class

/**
 * Manage Images UI Manage Images UI This class manages interaction between the
 * ManageImages ui and the ManageImages controller
 * 
 */

function ManageImagesUi(manageUi) {
	this.manageUi = manageUi;
	this._element = null;
}

ManageImagesUi.prototype.addClicked = function() {
	// Show the ADD page
}

ManageImagesUi.prototype.delClicked = function() {
	var id = this._getSelectedItemValue();
	if (id)
		manageImages.delete_(id);

}

ManageImagesUi.prototype.itemSelected = function(evt) {
	var id = this._getSelectedItemValue();
	if (id)
		manageImages.select(id);
}

ManageImagesUi.prototype.saveClicked = function(evt) {
	manageImages.save();
	;
}

ManageImagesUi.prototype.addImage = function(objOrArray) {
	var sel = this._element;
	if (objOrArray instanceof Array) {
		for ( var i = 0; i < objOrArray.length; ++i) {
			sel.options[sel.options.length] = objOrArray[i].optionElement();
		}
	} else {
		sel.options[sel.options.length] = objOrArray.optionElement();
	}
}

ManageImagesUi.prototype.setElement = function(element) {
	this._element = element;
}

ManageImagesUi.prototype.reload = function() {
	this._element.listLoader.run();
}

ManageImagesUi.prototype._getSelectedItemValue = function() {
	var sel = this._element;
	if (sel.selectedIndex >= sel.options.length)
		return null;

	var option = sel.options[sel.selectedIndex];
	var value = parseInt(option.getAttribute("value"));
	return value;
}

// ============================================================================
// Manage Images Add Class

/**
 * Manage Images Add This class is responsible for adding new images.
 */
function ManageImagesSubmit(submitUrl) {
	this._uploadUrl = submitUrl;
}

ManageImagesSubmit.prototype.fileSelected = function() {
	var file = document.getElementById('miSubmitData').files[0];
	if (file) {
		var fileSize = 0;
		if (file.size > 1024 * 1024)
			fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100)
					.toString()
					+ 'MB';
		else
			fileSize = (Math.round(file.size * 100 / 1024) / 100).toString()
					+ 'KB';

		document.getElementById('fileName').innerHTML = 'Name: ' + file.name;
		document.getElementById('fileSize').innerHTML = 'Size: ' + fileSize;
		document.getElementById('fileType').innerHTML = 'Type: ' + file.type;
	}
}

ManageImagesSubmit.prototype.uploadFile = function() {
	var this_ = this;
	var uploadProgress = function(e) {
		this_.uploadProgress(e)
	};
	var uploadComplete = function(e) {
		this_.uploadComplete(e)
	};
	var uploadFailed = function(e) {
		this_.uploadFailed(e)
	};
	var uploadCanceled = function(e) {
		this_.uploadCanceled(e)
	};

	var form = manageImagesFormElements();

	var fd = new FormData();
	fd.append("id", form.idElement.value);
	if (form.dataElement.files[0])
		fd.append("data", form.dataElement.files[0]);
	fd.append("name", form.nameElement.value);
	fd.append("comment", form.commentElement.value);
	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.addEventListener("load", uploadComplete, false);
	xhr.addEventListener("error", uploadFailed, false);
	xhr.addEventListener("abort", uploadCanceled, false);
	xhr.open("POST", this._uploadUrl);
	xhr.send(fd);
}

ManageImagesSubmit.prototype.uploadProgress = function(evt) {
	if (evt.lengthComputable) {
		var percentComplete = Math.round(evt.loaded * 100 / evt.total);
		document.getElementById('progressNumber').innerHTML = percentComplete
				.toString()
				+ '%';
		document.getElementById('prog').value = percentComplete;
	} else {
		document.getElementById('progressNumber').innerHTML = 'unable to compute';
	}
}

ManageImagesSubmit.prototype.uploadComplete = function(evt) {
	/* This event is raised when the server send back a response */
	if (evt.target.responseText)
		alert(evt.target.responseText);
	manageImages.ui.reload();
}

ManageImagesSubmit.prototype.uploadFailed = function(evt) {
	alert("There was an error attempting to upload the file.");
}

ManageImagesSubmit.prototype.uploadCanceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}

// ============================================================================
// Manage Images Load Class

/**
 * Manage Images This class is the controller for the ManageImage interface
 */
function ManageImagesFormLoader(element, url) {
	this._url = url;
	this._element = element;
	this._loadingUpdater = null;
};

ManageImagesFormLoader.prototype.load = function(id) {
	var this_ = this;

	this._loadingUpdater = new LoadingUpdater(this._element.id);

	var xmlhttp = httpRequest();
	xmlhttp.onreadystatechange = function() {
		this_._callback(xmlhttp);
	};
	var filtStr = getFiltStr({
		id : id
	});

	xmlhttp.open("GET", this._url + filtStr, true);
	xmlhttp.send();
}

ManageImagesFormLoader.prototype._callback = function(xmlhttp) {
	if (xmlhttp.readyState != 4)
		return;

	if (xmlhttp.status != 200) {
		this._loadingUpdater.setError();
		return;
	}

	// Get the XML document
	var xmlDoc = xmlhttp.responseXML;
	var xmlTag = xmlDoc.firstChild;

	// LOAD XML
	var form = manageImagesFormElements();
	form.idElement.value = xmlGetFirstTagValueStr(xmlTag, 'id');
	form.nameElement.value = xmlGetFirstTagValueStr(xmlTag, 'name');
	form.commentElement.value = xmlGetFirstTagValueStr(xmlTag, 'comment');

	// Stop the loading updater
	this._loadingUpdater.stop();
};

// ============================================================================
// Manage Images Class

/**
 * Manage Images Manage Images This class is the controller for the ManageImage
 * interface
 */
function ManageImages() {
	this._imageUrl = "/data/manage_images/image";
	this._imageSrcUrl = "/data/manage_images/image_src";
	this.submit = new ManageImagesSubmit(this._imageUrl);
	this.ui = new ManageImagesUi();
}

ManageImages.prototype.select = function(id) {
	var manageImageAddUpdate = document.getElementById('manageImageAddUpdate');
	new ManageImagesFormLoader(manageImageAddUpdate, this._imageUrl).load(id);

	var manageImagePreview = document.getElementById('manageImagePreview');
	manageImagePreview.src = this._imageSrcUrl + '?id=' + id;

}

ManageImages.prototype.save = function() {
	this.submit.uploadFile();
}

ManageImages.prototype.delete_ = function(id) {
// TODO Delete
}

// ============================================================================
// Create manage model instance

// Assigned and torn down by EditorUi when the ManageImages page is loaded
// unloaded
var manageImages = null;
