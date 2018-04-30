import logging
from typing import Union

from twisted.internet.defer import Deferred, inlineCallbacks

from peek_plugin_diagram._private.client.controller.LookupCacheController import \
    LookupCacheController
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

logger = logging.getLogger(__name__)


class ClientLookupTupleProvider(TuplesProviderABC):
    def __init__(self, lookupCacheController: LookupCacheController):
        self._lookupCacheController = lookupCacheController

    @inlineCallbacks
    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        modelSetKey = tupleSelector.selector["modelSetKey"]

        tuples = self._lookupCacheController.lookups(tupleSelector.name)

        if tuples:
            tuples = list(filter(lambda i: i.data["modelSetKey"] == modelSetKey, tuples))
        else:
            tuples = []

        payloadEnvelope = yield Payload(filt, tuples=tuples).makePayloadEnvelopeDefer()
        vortexMsg = yield  payloadEnvelope.toVortexMsgDefer()
        return vortexMsg

