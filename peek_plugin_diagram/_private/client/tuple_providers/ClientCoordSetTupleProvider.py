import logging
from typing import Union

from twisted.internet.defer import Deferred
from twisted.internet.defer import inlineCallbacks
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

from peek_plugin_diagram._private.client.controller.CoordSetCacheController import (
    CoordSetCacheController,
)

logger = logging.getLogger(__name__)


class ClientCoordSetTupleProvider(TuplesProviderABC):
    def __init__(self, coordSetCacheController: CoordSetCacheController):
        self._coordSetCacheController = coordSetCacheController

    @inlineCallbacks
    def makeVortexMsg(
        self, filt: dict, tupleSelector: TupleSelector
    ) -> Union[Deferred, bytes]:
        tuples = self._coordSetCacheController.coordSets

        payloadEnvelope = yield Payload(
            filt, tuples=tuples
        ).makePayloadEnvelopeDefer()
        vortexMsg = yield payloadEnvelope.toVortexMsgDefer()
        return vortexMsg
