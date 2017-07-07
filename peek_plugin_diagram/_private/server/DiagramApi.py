import logging
from typing import List

from twisted.internet import defer
from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.server.controller.StatusController import StatusController
from peek_plugin_diagram.server.DiagramApiABC import DiagramApiABC

logger = logging.getLogger(__name__)


class DiagramApi(DiagramApiABC):
    def __init__(self, mainController: StatusController,
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

        if disps is None:
            raise Exception("Disps must be an interable")

        if not disps:
            return defer.succeed(True)


        return self._dispImportController.importDisps(
            modelSetName, coordSetName,
            importGroupHash, disps
        )

    def importLookups(self, modelSetName: str, coordSetName: str,
                      lookupTupleType: str, lookupTuples: List) -> Deferred:
        return self._lookupImportController.importLookups(
            modelSetName, coordSetName, lookupTupleType, lookupTuples
        )
