import logging
from typing import Union

from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.client.controller.CoordSetCacheController import \
    CoordSetCacheController
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.tuples.GridCacheIndexTuple import GridCacheIndexTuple
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

logger = logging.getLogger(__name__)


class GridCacheIndexTupleProvider(TuplesProviderABC):
    def __init__(self, gridCacheController: GridCacheController):
        self._gridCacheController = gridCacheController

    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        tuple = GridCacheIndexTuple()
        tuple.data = self._gridCacheController.gridDatesByKey()

        return Payload(filt, tuples=[tuple]).toVortexMsgDefer()
