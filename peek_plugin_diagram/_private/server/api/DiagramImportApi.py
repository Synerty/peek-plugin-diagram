import logging
from typing import List

from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram.server.DiagramImportApiABC import DiagramImportApiABC

logger = logging.getLogger(__name__)


class DiagramImportApi(DiagramImportApiABC):
    def __init__(self, mainController: StatusController,
                 dispImportController: DispImportController,
                 lookupImportController: LookupImportController):
        self._mainController = mainController
        self._dispImportController = dispImportController
        self._lookupImportController = lookupImportController

    def shutdown(self):
        pass

    def importDisps(self, modelSetKey: str,
                    coordSetKey: str,
                    importGroupHash: str,
                    dispsEncodedPayload: bytes) -> Deferred:
        return self._dispImportController.importDisps(
            modelSetKey, coordSetKey,
            importGroupHash, dispsEncodedPayload
        )

    def importLookups(self, modelSetKey: str, coordSetKey: str,
                      lookupTupleType: str, lookupTuples: List,
                      deleteOthers: bool = True,
                      updateExisting: bool = True) -> Deferred:
        return self._lookupImportController.importLookups(
            modelSetKey, coordSetKey, lookupTupleType, lookupTuples,
            deleteOthers, updateExisting
        )

    def getLookups(self, modelSetKey: str, coordSetKey: str,
                   lookupTupleType: str) -> Deferred:
        return self._lookupImportController.getLookups(
            modelSetKey, coordSetKey, lookupTupleType
        )
