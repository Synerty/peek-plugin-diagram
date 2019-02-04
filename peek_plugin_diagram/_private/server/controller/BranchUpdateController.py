import logging
from twisted.internet.defer import inlineCallbacks, Deferred
from vortex.Payload import Payload
from vortex.TupleAction import TupleActionABC
from vortex.handler.TupleActionProcessor import TupleActionProcessorDelegateABC

from peek_plugin_diagram._private.tuples.branch.BranchUpdateTupleAction import \
    BranchUpdateTupleAction
from peek_plugin_diagram._private.worker.tasks.branch.BranchIndexImporter import \
    createOrUpdateBranches
from peek_plugin_diagram._private.worker.tasks.branch.BranchIndexUpdater import \
    updateBranches
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC

logger = logging.getLogger(__name__)


class BranchUpdateController(TupleActionProcessorDelegateABC):
    """ Branch Update Controller

    This controller handles the branch updates from the UI

    """

    def __init__(self, liveDbWriteApi: LiveDBWriteApiABC):
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        self._liveDbWriteApi = None

    @inlineCallbacks
    def updateBranch(self, branchEncodedPayload: bytes):
        liveDbItemsToImport = yield update.delay(branchEncodedPayload)

    @inlineCallbacks
    def importBranches(self, branchesEncodedPayload: bytes):
        yield createOrUpdateBranches.delay(branchesEncodedPayload)

    @inlineCallbacks
    def processTupleAction(self, tupleAction: TupleActionABC) -> Deferred:
        if not isinstance(tupleAction, BranchUpdateTupleAction):
            raise Exception("Unhandled tuple action %s" % tupleAction)

        encodedPayload = yield Payload(tuples=[tupleAction.branchTuple]) \
            .toEncodedPayloadDefer()

        yield updateBranches.delay(tupleAction.modelSetId, encodedPayload)
