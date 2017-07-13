import logging
from typing import List

from peek_plugin_diagram._private.worker.tasks.ImportDispTask import importDispsTask
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC
from twisted.internet.defer import inlineCallbacks

logger = logging.getLogger(__name__)


class DispImportController:
    def __init__(self, liveDbWriteApi: LiveDBWriteApiABC):
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        self._liveDbWriteApi = None

    @inlineCallbacks
    def importDisps(self, modelSetName: str, coordSetName: str,
                    importGroupHash: str, disps: List):
        liveDbItemsToImport = yield importDispsTask.delay(
            modelSetName, coordSetName, importGroupHash, disps
        )

        if liveDbItemsToImport:
            yield self._liveDbWriteApi.importLiveDbItems(
                modelSetName, liveDbItemsToImport
            )
