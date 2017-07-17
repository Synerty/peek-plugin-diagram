import logging
from datetime import datetime
from typing import List

from sqlalchemy.sql.expression import asc
from twisted.internet import task
from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    DispIndexerQueue as DispIndexerQueueTable
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

logger = logging.getLogger(__name__)


class DispCompilerQueueController:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    FETCH_SIZE = 500
    PERIOD = 0.200

    def __init__(self, ormSessionCreator, statusController: StatusController):
        self._ormSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = 0
        self._queueCount = 0


    def start(self):
        self._statusController.setDisplayCompilerStatus(True, self._queueCount)
        d = self._pollLoopingCall.start(self.PERIOD, now=False)
        d.addCallbacks(self._timerCallback, self._timerErrback)

    def _timerErrback(self, failure):
        vortexLogFailure(failure, logger)
        self._statusController.setDisplayCompilerStatus(False, self._queueCount)
        self._statusController.setDisplayCompilerError(str(failure.value))

    def _timerCallback(self, _):
        self._statusController.setDisplayCompilerStatus(False, self._queueCount)

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
        queueIds = [o.id for o in queueItems]
        dispIds = list(set([o.dispId for o in queueItems]))

        from peek_plugin_diagram._private.worker.tasks.DispCompilerTask import \
            compileDisps

        # deferLater, to make it call in the main thread.
        d = compileDisps.delay(queueIds, dispIds)
        d.addCallback(self._pollCallback, datetime.utcnow(), len(queueItems))
        d.addErrback(self._pollErrback, datetime.utcnow(), len(queueItems))

        self._queueCount += 1
        self._statusController.setDisplayCompilerStatus(True, self._queueCount)

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._ormSessionCreator()
        try:
            queueItems = (session.query(DispIndexerQueueTable)
                          .order_by(asc(DispIndexerQueueTable.id))
                          .filter(DispIndexerQueueTable.id > self._lastQueueId)
                          .yield_per(self.FETCH_SIZE)
                          .limit(self.FETCH_SIZE)
                          .all())

            session.expunge_all()
            return queueItems
        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _pollCallback(self, arg, startTime, dispCount):
        self._queueCount -= 1
        logger.debug("%s Disps, Time Taken = %s" % (dispCount, datetime.utcnow() - startTime))
        self._statusController.setDisplayCompilerStatus(True, self._queueCount)
        self._statusController.addToDisplayCompilerTotal(self.FETCH_SIZE)

    def _pollErrback(self, failure, startTime, dispCount):
        self._queueCount -= 1
        logger.debug("%s Disps, Time Taken = %s" % (dispCount, datetime.utcnow() - startTime))
        self._statusController.setDisplayCompilerStatus(True, self._queueCount)
        self._statusController.setDisplayCompilerError(str(failure.value))
        vortexLogFailure(failure, logger)

    @deferToThreadWrapWithLogger(logger)
    def queueDisps(self, dispIds):
        return self.queueDispIdsToCompile(dispIds, self._ormSessionCreator)

    @staticmethod
    def queueDispIdsToCompile(dispIdsToCompile: List[int], ormSessionCreator):
        if not dispIdsToCompile:
            return

        logger.debug("Queueing %s disps for compile", len(dispIdsToCompile))

        inserts = []
        for dispId in dispIdsToCompile:
            inserts.append(dict(dispId=dispId))

        ormSession = ormSessionCreator()
        try:
            ormSession.execute(DispIndexerQueueTable.__table__.insert(), inserts)
            ormSession.commit()
        finally:
            ormSession.close()