import logging
from typing import Union

from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.client.controller.CoordSetCacheController import \
    CoordSetCacheController
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

logger = logging.getLogger(__name__)


class ClientCoordSetTupleProvider(TuplesProviderABC):
    def __init__(self, coordSetCacheController: CoordSetCacheController):
        self._coordSetCacheController = coordSetCacheController

    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        modelSetKey = tupleSelector.selector["modelSetKey"]

        tuples = list(filter(lambda i: i.data["modelSetKey"] == modelSetKey,
                             self._coordSetCacheController.coordSets))

        return Payload(filt, tuples=tuples).toVortexMsgDefer()
