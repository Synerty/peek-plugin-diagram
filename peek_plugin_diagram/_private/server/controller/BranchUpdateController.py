import logging

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.worker.tasks.branch.BranchIndexImporter import \
    createOrUpdateBranchs
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC

logger = logging.getLogger(__name__)


class BranchUpdateController:
    def __init__(self, liveDbWriteApi: LiveDBWriteApiABC):
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        self._liveDbWriteApi = None

    @inlineCallbacks
    def updateBranch(self, branchEncodedPayload:bytes):
        liveDbItemsToImport = yield createOrUpdateBranchs.delay(branchEncodedPayload)

    @inlineCallbacks
    def importBranches(self, branchesEncodedPayload: bytes):
        liveDbItemsToImport = yield createOrUpdateBranchs.delay(branchesEncodedPayload)

        # if liveDbItemsToImport:
        #     yield self._liveDbWriteApi.importLiveDbItems(
        #         modelSetKey, liveDbItemsToImport
        #     )
        #
        #     yield self._liveDbWriteApi.pollLiveDbValueAcquisition(
        #         modelSetKey, [i.key for i in liveDbItemsToImport]
        #     )
