import json
import logging
from typing import List

from peek_plugin_diagram._private.worker.tasks.ImportDispTask import importDispsTask
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC
from twisted.internet.defer import inlineCallbacks
from vortex.SerialiseUtil import convertFromWkbElement

logger = logging.getLogger(__name__)


class DispImportController:
    def __init__(self, liveDbWriteApi: LiveDBWriteApiABC):
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        self._liveDbWriteApi = None

    @inlineCallbacks
    def importDisps(self, modelSetName: str, coordSetName: str,
                    importGroupHash: str, disps: List):
        for disp in disps:
            # Celery 3.0 uses pickle, and it has trouble with WKBElement
            # This is something the import worker did anyway
            if hasattr(disp, "geom"):
                disp.geom = json.dumps(convertFromWkbElement(disp.geom))

        liveDbItemsToImport = yield importDispsTask.delay(
            modelSetName, coordSetName, importGroupHash, disps
        )

        if liveDbItemsToImport:
            yield self._liveDbWriteApi.importLiveDbItems(
                modelSetName, liveDbItemsToImport
            )
