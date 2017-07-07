import logging
from typing import Union

from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC

logger = logging.getLogger(__name__)


class DiagramLoaderStatusTupleProvider(TuplesProviderABC):
    def __init__(self, statusController: StatusController):
        self._statusController = statusController

    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        return Payload(filt, tuples=[self._statusController.status]).toVortexMsg()
