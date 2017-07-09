// ============================================================================
// Editor Image Cache Load Class

/**
 * Editor Image Cache This class is the controller for the ManageImage interface
 */
function EditorImageCacheLoader(id, url) {
	this._url = url;
	this.id = id;

	var filtStr = getFiltStr({
		id : this.id
	});

	var this_ = this;
	var callback = function(e) {
		this_._callback(e);
	}

	this._imageObj = new Image();
	this._imageObj.onload = callback;
	this._imageObj.onabort = callback;
	this._imageObj.onerror = callback;
	this._imageObj.src = this._url + filtStr;
}

EditorImageCacheLoader.prototype._callback = function(e) {
	editorImageCache
			._loaderCallback(e.type == 'load', this.id, this._imageObj);
};

// ============================================================================
// Editor Image Cache Class

/**
 * Editor Image Cache Editor Image Cache This class is the controller for the
 * ManageImage interface
 */
function EditorImageCache() {
	this._imageSrcUrl = "/data/manage_images/image_src";
	this._cache = {};
	this._cacheLoaders = {};
	this._prepareInProgress = false;
	this._prepareCacheCallback = null;
	this._unrecoverableError = false;
}

EditorImageCache.prototype.prepareCache = function(renderables, callback) {
	var this_ = this;

	if (this._prepareInProgress || this._unrecoverableError)
		return;

	// Replace the cache, keep the old so we can leverage it
	var oldCache = this._cache;
	this._cache = {};
	this._cacheLoaders = {};

	this._prepareInProgress = true;
	this._prepareCacheCallback = callback;

	// Unique set to determine if we have delt with this id before
	var imageIdSet = {};

	for ( var i = 0; i < renderables.length; ++i) {
		var renderable = renderables[i];
		if (renderable.type != Renderable.IMAGE)
			continue;

		var id = renderable.image;
		// If null IDs, IEf renderables with unassigned images
		if (!id)
			continue;

		// If we've already delt with this one
		if (imageIdSet.hasOwnProperty(id))
			continue;

		// Recored that we've delt with this one
		imageIdSet[id] = true;

		// If we've already cached it, then re-use the cache
		// TODO ImageCache It won't reload updates
		if (oldCache.hasOwnProperty(id)) {
			this._cache[id] = oldCache[id];
			continue;
		}

		// Load the image into the cache
		this._cacheLoaders[id] = new EditorImageCacheLoader(id,
				this._imageSrcUrl);
	}

	if (!this._cacheLoadersRunning()) {
		this._prepareInProgress = false;
		if (callback)
			callback();
	}
}
EditorImageCache.prototype._loaderCallback = function(success, id, imageObj) {
	if (this._unrecoverableError)
		return;

	if (!success) {
		this._unrecoverableError = true;
		usrMsgDispatcher.logError("A fatal error occurred when caching images");
		return;
	}

	assert(this._cacheLoaders.hasOwnProperty(id), "Image cache error\n"
			+ "Image cache loader is missing image for id |" + id + "|");

	this._cache[id] = imageObj;

	delete this._cacheLoaders[id];

	if (!this._cacheLoadersRunning()) {
		this._prepareInProgress = false;

		if (this._prepareCacheCallback)
			this._prepareCacheCallback();
	}
}

EditorImageCache.prototype.image = function(id) {
//	assert(this._cache.hasOwnProperty(id), "Image cache error\n"
//			+ "Image cache is missing image for id |" + id + "|");

	return this._cache[id];
}

EditorImageCache.prototype._cacheLoadersRunning = function() {
	for (k in this._cacheLoaders)
		if (this._cacheLoaders.hasOwnProperty(k))
			return true;
	return false;
}

// ============================================================================
// Create manage model instance

// Assigned and torn down by EditorUi when the EditorImageCache page is loaded
// unloaded
var editorImageCache = null;
var _editorImageCacheInit = function() {
	editorImageCache = new EditorImageCache();
};
