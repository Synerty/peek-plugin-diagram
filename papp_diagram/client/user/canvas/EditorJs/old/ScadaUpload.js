
// ============================================================================
// Manage Images Add Class

/**
 * Manage Images Add This class is responsible for adding new images.
 */
function ScadaUpload() {
	this._uploadUrl = '/data/scada_upload/upload';
	this._dataElement = document.getElementById('tbScadaUpload');

	var randArg = Math.random() + "." + (new Date()).getTime();
	this._uploadUrl += '?__randArg__=' + randArg;
}




ScadaUpload.prototype.upload = function() {
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

	var fd = new FormData();
	if (!this._dataElement.files[0])
		return;
	
	fd.append("data", this._dataElement.files[0]);
	
	var xhr = new XMLHttpRequest();
//	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.addEventListener("load", uploadComplete, false);
	xhr.addEventListener("error", uploadFailed, false);
	xhr.addEventListener("abort", uploadCanceled, false);
	xhr.open("POST", this._uploadUrl);
	xhr.send(fd);
}


ScadaUpload.prototype.uploadComplete = function(evt) {
	if (evt.target.responseText) {
		var errCount = evt.target.responseText.split("\n").length;
		alert("ERROR\n\n"
				+"There are " + errCount + " errors and warnings, please review them.\n"
				);
		
		var encoded = encodeURIComponent(evt.target.responseText);
		
		var pom = document.createElement('a');
	    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encoded );
	    pom.setAttribute('download', "ImportLog.txt");
	    pom.click();
		
	} else {
		alert("The RTU configuration has been imported successfully");
	}
}

ScadaUpload.prototype.uploadFailed = function(evt) {
	alert("There was an error attempting to upload the file.");
}

ScadaUpload.prototype.uploadCanceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}



// ============================================================================
// Create Scada Upload manager instance

var scadaUpload = null;
bodyLoader.add(function() {
	scadaUpload = new ScadaUpload();
});
