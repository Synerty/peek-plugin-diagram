import logging
from typing import List

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.worker.tasks.DispLinkImportTask import \
    importDispLinksTask
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC

logger = logging.getLogger(__name__)


class DispLinkImportController:
    """ Disp Link Import Controller
    """

    def __init__(self, dbSessionCreator, getPgSequenceGenerator,
                 liveDbWriteApi: LiveDBWriteApiABC):
        self._dbSessionCreator = dbSessionCreator
        self._getPgSequenceGenerator = getPgSequenceGenerator
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        pass

    @inlineCallbacks
    def importDispLiveDbDispLinks(self, modelSetName: str,
                                  coordSet: ModelCoordSet,
                                  importGroupHash: str,
                                  importDispLinks: List[ImportLiveDbDispLinkTuple]):
        # dispLinkIdIterator = yield self._getPgSequenceGenerator(
        #     LiveDbDispLink, len(importDispLinks)
        # )

        liveDbItemsToImport = yield importDispLinksTask.delay(
            coordSet, importGroupHash, importDispLinks
        )

        if liveDbItemsToImport:
            yield self._liveDbWriteApi.importLiveDbItems(modelSetName,
                                                         liveDbItemsToImport)
