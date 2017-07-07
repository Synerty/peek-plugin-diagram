import logging
from typing import Dict, List

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from peek_plugin_diagram._private.tuples.GridTuple import GridTuple
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint
from vortex.TupleSelector import TupleSelector

logger = logging.getLogger(__name__)

gridCachePayloadFilt = dict(key="client.gridkey.update")
gridCachePayloadFilt.update(diagramFilt)

gridCoordSetCachePayloadFilt = dict(key="client.grid.coordset.update")
gridCoordSetCachePayloadFilt.update(diagramFilt)


class GridCacheController:
    """ Grid Cache Controller

    The grid cache controller stores all the grids in memory, allowing fast access from
    the mobile and desktop devices.

    """

    #: This stores the cache of grid data for the clients
    _gridCache: Dict[str, GridTuple] = None

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
        self._gridEndpoint = PayloadEndpoint(gridCachePayloadFilt,
                                             self._processGridPayload)

        count = 200
        offset = 0
        while True:
            logger.info("Loading grids %s to %s" % (offset, offset + count))
            gridTuples = yield RpcForClient.loadGrids(offset, count)
            if not gridTuples:
                break
            self._processUpdates(gridTuples)
            offset += count

    def shutdown(self):
        self._tupleObservable = None

        self._gridEndpoint.shutdown()
        self._gridEndpoint = None

        self._gridCache = {}
        self._cachedGridCoordSetIds = set()

    def _processGridPayload(self, payload: Payload, **kwargs):
        gridTuples: List[GridTuple] = payload.tuples
        self._processUpdates(gridTuples)

    def _processUpdates(self, gridTuples: List[GridTuple]):
        gridKeyUpdates: List[str] = []

        for t in gridTuples:
            if (not t.gridKey in self._gridCache or
                        self._gridCache[t.gridKey].updateDate < t.updateDate):
                self._gridCache[t.gridKey] = t
                gridKeyUpdates.append(t.gridKey)

        self._gridCacheHandler.notifyOfGridUpdate(gridKeyUpdates)

    def grid(self, gridKey) -> GridTuple:
        return self._gridCache.get(gridKey)
