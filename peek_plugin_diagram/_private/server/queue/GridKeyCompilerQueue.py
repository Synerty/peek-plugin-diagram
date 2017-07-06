import logging
from datetime import datetime

from twisted.internet import task
from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    GridKeyCompilerQueue as GridKeyCompilerQueueTable
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure
from vortex.Payload import Payload

logger = logging.getLogger(__name__)


class GridKeyCompilerQueue:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue

    """

    FETCH_SIZE = 15
    PERIOD = 0.200

    def __init__(self, ormSessionCreator, statusController: StatusController):
        self._ormSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = 0
        self._queueCount = 0

    def start(self):
        self._statusController.setGridCompilerStatus(True, self._queueCount)
        d = self._pollLoopingCall.start(self.PERIOD, now=False)
        d.addCallbacks(self._timerCallback, self._timerErrback)

    def _timerErrback(self, failure):
        vortexLogFailure(failure, logger)
        self._statusController.setGridCompilerStatus(False, self._queueCount)
        self._statusController.setGridCompilerError(str(failure.value))

    def _timerCallback(self, _):
        self._statusController.setGridCompilerStatus(False, self._queueCount)

    def stop(self):
        self._pollLoopingCall.stop()

    def shutdown(self):
        self.stop()

    @inlineCallbacks
    def _poll(self):

        queueItems = yield self._grabQueueChunk()
        if not queueItems:
            return

        self._lastQueueId = queueItems[-1].id

        from peek_plugin_diagram._private.worker.tasks.GridKeyCompilerTask import compileGrids

        # deferLater, to make it call in the main thread.
        d = compileGrids.delay(Payload(tuples=queueItems)._toJson())
        d.addCallback(self._pollCallback, datetime.utcnow(), len(queueItems))
        d.addErrback(self._pollErrback, datetime.utcnow())

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._ormSessionCreator()
        try:
            qry = (session.query(GridKeyCompilerQueueTable)
                   .filter(GridKeyCompilerQueueTable.id > self._lastQueueId)
                   .yield_per(self.FETCH_SIZE)
                   .limit(self.FETCH_SIZE))

            queueItems = qry.all()
            session.expunge_all()
            return queueItems

        finally:
            session.close()

    def _pollCallback(self, arg, startTime, processedCount):
        logger.debug("Time Taken = %s" % (datetime.utcnow() - startTime))
        self._statusController.addToGridCompilerTotal(processedCount)

    def _pollErrback(self, failure, startTime):
        logger.debug("Time Taken = %s" % (datetime.utcnow() - startTime))
        self._statusController.setGridCompilerError(str(failure.value))
        vortexLogFailure(failure, logger)


