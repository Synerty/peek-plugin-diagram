import logging
from typing import Dict, List

from twisted.internet.defer import inlineCallbacks, Deferred

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from peek_plugin_diagram._private.tuples.GridTuple import GridTuple
from vortex.DeferUtil import vortexLogFailure
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint

logger = logging.getLogger(__name__)

clientGridUpdateFromServerFilt = dict(key="clientGridUpdateFromServer")
clientGridUpdateFromServerFilt.update(diagramFilt)

clientCoordSetUpdateFromServerFilt = dict(key="clientCoordSetUpdateFromServer")
clientCoordSetUpdateFromServerFilt.update(diagramFilt)


class GridCacheController:
    """ Grid Cache Controller

    The grid cache controller stores all the grids in memory, allowing fast access from
    the mobile and desktop devices.

    """

    #: This stores the cache of grid data for the clients
    _gridCache: Dict[str, GridTuple] = None

    LOAD_CHUNK = 200

    def __init__(self, clientId: str):
        self._clientId = clientId
        self._gridCacheHandler = None
        self._gridCache = {}

        self._gridEndpoint = None
        self._coordSetEndpoint = None

    def setGridCacheHandler(self, gridCacheHandler):
        self._gridCacheHandler = gridCacheHandler

    @inlineCallbacks
    def start(self):
        self._gridEndpoint = PayloadEndpoint(clientGridUpdateFromServerFilt,
                                             self._processGridPayload)

        self._coordSetEndpoint = PayloadEndpoint(clientCoordSetUpdateFromServerFilt,
                                                 self._processCoordSetPayload)

        yield self.reloadCache()

    def shutdown(self):
        self._tupleObservable = None

        self._gridEndpoint.shutdown()
        self._gridEndpoint = None

        self._gridCache = {}
        # self._cachedGridCoordSetIds = set()

    @inlineCallbacks
    def reloadCache(self):
        self._gridCache = {}
        # self._cachedGridCoordSetIds = set()

        offset = 0
        while True:
            logger.info("Loading grids %s to %s" % (offset, offset + self.LOAD_CHUNK))
            gridTuples = yield RpcForClient.loadGrids(offset, self.LOAD_CHUNK)
            if not gridTuples:
                break
            self._loadGridIntoCache(gridTuples)
            offset += self.LOAD_CHUNK

    def _processCoordSetPayload(self, payload: Payload, **kwargs):
        d: Deferred = self.reloadCache()
        d.addErrback(vortexLogFailure, logger, consumeError=True)

    def _processGridPayload(self, payload: Payload, **kwargs):
        gridTuples: List[GridTuple] = payload.tuples
        self._loadGridIntoCache(gridTuples)

    def _loadGridIntoCache(self, gridTuples: List[GridTuple]):
        gridKeyUpdates: List[str] = []

        for t in gridTuples:
            if (not t.gridKey in self._gridCache or
                        self._gridCache[t.gridKey].lastUpdate != t.lastUpdate):
                self._gridCache[t.gridKey] = t
                gridKeyUpdates.append(t.gridKey)

        logger.debug("Received grid updates from server, %s", gridKeyUpdates)

        self._gridCacheHandler.notifyOfGridUpdate(gridKeyUpdates)

    def grid(self, gridKey) -> GridTuple:
        return self._gridCache.get(gridKey)
