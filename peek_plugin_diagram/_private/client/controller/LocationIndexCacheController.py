import logging
from typing import Dict, List

from twisted.internet.defer import inlineCallbacks, Deferred

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.ClientLocationIndexLoaderRpc import ClientLocationIndexLoaderRpc
from peek_plugin_diagram._private.tuples.LocationIndexTuple import LocationIndexTuple
from vortex.DeferUtil import vortexLogFailure
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint

logger = logging.getLogger(__name__)

clientLocationIndexUpdateFromServerFilt = dict(key="clientLocationIndexUpdateFromServer")
clientLocationIndexUpdateFromServerFilt.update(diagramFilt)


class LocationIndexCacheController:
    """ Disp Key Cache Controller

    The locationIndex cache controller stores all the locationIndexs in memory, allowing fast access from
    the mobile and desktop devices.

    """

    #: This stores the cache of locationIndex data for the clients
    _cache: Dict[str, LocationIndexTuple] = None

    LOAD_CHUNK = 50

    def __init__(self, clientId: str):
        self._clientId = clientId
        self._cacheHandler = None
        self._cache = {}

        self._endpoint = None

    def setLocationIndexCacheHandler(self, locationIndexCacheHandler):
        self._cacheHandler = locationIndexCacheHandler

    @inlineCallbacks
    def start(self):
        self._endpoint = PayloadEndpoint(clientLocationIndexUpdateFromServerFilt,
                                         self._processLocationIndexPayload)

        yield self.reloadCache()

    def shutdown(self):
        self._tupleObservable = None

        self._endpoint.shutdown()
        self._endpoint = None

        self._cache = {}

    @inlineCallbacks
    def reloadCache(self):
        self._cache = {}

        offset = 0
        while True:
            logger.info("Loading LocationIndex %s to %s" % (offset, offset + self.LOAD_CHUNK))
            locationIndexTuples = yield ClientLocationIndexLoaderRpc.loadLocationIndexes(offset, self.LOAD_CHUNK)
            if not locationIndexTuples:
                break
            self._loadLocationIndexIntoCache(locationIndexTuples)
            offset += self.LOAD_CHUNK

    def _processCoordSetPayload(self, payload: Payload, **kwargs):
        d: Deferred = self.reloadCache()
        d.addErrback(vortexLogFailure, logger, consumeError=True)

    def _processLocationIndexPayload(self, payload: Payload, **kwargs):
        locationIndexTuples: List[LocationIndexTuple] = payload.tuples
        self._loadLocationIndexIntoCache(locationIndexTuples)

    def _loadLocationIndexIntoCache(self, locationIndexTuples: List[LocationIndexTuple]):
        indexBucketsUpdated: List[str] = []

        for t in locationIndexTuples:
            if (not t.indexBucket in self._cache or
                        self._cache[t.indexBucket].lastUpdate != t.lastUpdate):
                self._cache[t.indexBucket] = t
                indexBucketsUpdated.append(t.indexBucket)

        logger.debug("Received locationIndex updates from server, %s", indexBucketsUpdated)

        self._cacheHandler.notifyOfLocationIndexUpdate(indexBucketsUpdated)

    def locationIndex(self, indexBucket) -> LocationIndexTuple:
        return self._cache.get(indexBucket)
