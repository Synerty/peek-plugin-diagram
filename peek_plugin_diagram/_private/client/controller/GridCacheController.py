import logging
from typing import Dict, List

from twisted.internet.defer import inlineCallbacks, Deferred

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.ClientGridLoaderRpc import \
    ClientGridLoaderRpc
from peek_plugin_diagram._private.tuples.GridTuple import GridTuple
from peek_plugin_diagram._private.tuples.EncodedGridTuple import EncodedGridTuple
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

    NOTE: The grid set endpoint triggers a reload, this is in the case when grid sets
    are enable or disabled. Perhaps the system should just be restarted instead.

    """

    #: This stores the cache of grid data for the clients
    _gridCache: Dict[str, GridTuple] = None

    LOAD_CHUNK = 200

    def __init__(self, clientId: str):
        self._clientId = clientId
        self._gridCacheHandler = None
        self._gridCache: Dict[str, EncodedGridTuple] = {}

        self._gridEndpoint = PayloadEndpoint(clientGridUpdateFromServerFilt,
                                             self._processGridPayload)

        self._coordSetEndpoint = PayloadEndpoint(clientCoordSetUpdateFromServerFilt,
                                                 self._processCoordSetPayload)

    def setGridCacheHandler(self, gridCacheHandler):
        self._gridCacheHandler = gridCacheHandler

    @inlineCallbacks
    def start(self):
        yield self.reloadCache()

    def shutdown(self):
        self._tupleObservable = None

        self._gridEndpoint.shutdown()
        self._gridEndpoint = None

        self._coordSetEndpoint.shutdown()
        self._coordSetEndpoint = None

        self._gridCache = {}
        # self._cachedGridCoordSetIds = set()

    @inlineCallbacks
    def reloadCache(self):
        self._gridCache = {}
        # self._cachedGridCoordSetIds = set()

        offset = 0
        while True:
            logger.info("Loading grids %s to %s" %
                        (offset, offset + self.LOAD_CHUNK))
            gridTuples = yield ClientGridLoaderRpc.loadGrids(offset, self.LOAD_CHUNK)
            if not gridTuples:
                break
            self._loadGridIntoCache(gridTuples)
            offset += self.LOAD_CHUNK

    def _processGridPayload(self, payload: Payload, **kwargs):
        print(':-] ' * 20)
        print(payload.filt)
        gridTuples: List[GridTuple] = payload.tuples
        return self._loadGridIntoCache(gridTuples)

    def _processCoordSetPayload(self, payload: Payload, **kwargs):
        d: Deferred = self.reloadCache()
        d.addErrback(vortexLogFailure, logger, consumeError=True)

    def _loadGridIntoCache(self, encodedGridTuples: List[EncodedGridTuple]):
        gridKeyUpdates: List[str] = []

        for t in encodedGridTuples:
            if (not t.gridKey in self._gridCache or
                    self._gridCache[t.gridKey].lastUpdate != t.lastUpdate):
                self._gridCache[t.gridKey] = t
                gridKeyUpdates.append(t.gridKey)

        logger.debug("Received grid updates from server, %s", gridKeyUpdates)

        self._gridCacheHandler.notifyOfGridUpdate(gridKeyUpdates)

    def grid(self, gridKey) -> EncodedGridTuple:
        return self._gridCache.get(gridKey)

    def gridKeyList(self) -> List[str]:
        return list(self._gridCache.keys())

    def gridDatesByKey(self):
        return {g.gridKey: g.lastUpdate for g in self._gridCache.values()}
