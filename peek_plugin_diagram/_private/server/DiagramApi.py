import logging
from typing import List

from twisted.internet import defer
from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.server.controller.MainController import MainController
from peek_plugin_diagram.server.DiagramApiABC import DiagramApiABC

logger = logging.getLogger(__name__)


class DiagramApi(DiagramApiABC):
    def __init__(self, mainController: MainController,
                 dispImportController: DispImportController,
                 lookupImportController: LookupImportController):
        self._mainController = mainController
        self._dispImportController = dispImportController
        self._lookupImportController = lookupImportController

    def shutdown(self):
        pass

    def importDisps(self, modelSetName: str,
                    coordSetName: str,
                    importGroupHash: str,
                    disps: List) -> Deferred:
        logger.warning("importDisp doesn't do anything at this point")
        return defer.succeed(True)
        # return self._dispImportController.importDisps(
        #     modelSetName, coordSetName,
        #     importGroupHash, disps
        # )

    def importLookups(self, modelSetName: str, coordSetName: str,
                      lookupTupleType: str, lookupTuples: List) -> Deferred:
        return self._lookupImportController.importLookups(
            modelSetName, coordSetName, lookupTupleType, lookupTuples
        )
