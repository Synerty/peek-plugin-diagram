import logging
from typing import List

from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram.server.DiagramApiABC import DiagramApiABC
from twisted.internet import defer
from twisted.internet.defer import Deferred

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
                    dispsVortexMsg: bytes) -> Deferred:

        return self._dispImportController.importDisps(
            modelSetName, coordSetName,
            importGroupHash, dispsVortexMsg
        )

    def importLookups(self, modelSetName: str, coordSetName: str,
                      lookupTupleType: str, lookupTuples: List,
                      deleteOthers: bool = True) -> Deferred:
        return self._lookupImportController.importLookups(
            modelSetName, coordSetName, lookupTupleType, lookupTuples, deleteOthers
        )

    def getLookups(self, modelSetName: str, coordSetName: str,
                   lookupTupleType: str) -> Deferred:
        return self._lookupImportController.getLookups(
            modelSetName, coordSetName, lookupTupleType
        )
