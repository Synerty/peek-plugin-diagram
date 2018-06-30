import logging
from typing import Union

from twisted.internet.defer import Deferred, inlineCallbacks

from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.tuples.grid.GridUpdateDateTuple import GridUpdateDateTuple
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

logger = logging.getLogger(__name__)


class GridCacheIndexTupleProvider(TuplesProviderABC):
    def __init__(self, gridCacheController: GridCacheController):
        self._gridCacheController = gridCacheController

    @inlineCallbacks
    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        tuple = GridUpdateDateTuple()
        tuple.updateDateByChunkKey = self._gridCacheController.gridDatesByKey()

        payloadEnvelope = yield Payload(filt, tuples=[tuple]).makePayloadEnvelopeDefer()
        vortexMsg = yield  payloadEnvelope.toVortexMsgDefer()
        return vortexMsg
