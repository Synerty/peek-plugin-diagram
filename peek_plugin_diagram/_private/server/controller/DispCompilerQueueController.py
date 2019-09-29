import logging
from datetime import datetime
from typing import List

import pytz
from sqlalchemy.sql.expression import asc
from twisted.internet import task, reactor
from twisted.internet.defer import inlineCallbacks
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    DispIndexerQueue as DispIndexerQueueTable

logger = logging.getLogger(__name__)


class DispCompilerQueueController:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    DE_DUPE_FETCH_SIZE = 10000
    ITEMS_PER_TASK = 500
    PERIOD = 0.200

    def __init__(self, ormSessionCreator, statusController: StatusController):
        self._ormSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = 0
        self._queueCount = 0

        self._chunksInProgress = set()

    def isBusy(self) -> bool:
        return self._queueCount != 0

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
        if self._pollLoopingCall.running:
            self._pollLoopingCall.stop()

    def shutdown(self):
        self.stop()

    @inlineCallbacks
    def _poll(self):

        queueItems = yield self._grabQueueChunk()

        if not queueItems:
            return

        # If we're already processing these chunks, then return and try later
        if self._chunksInProgress & set([o.dispId for o in queueItems]):
            return

        # This should never fail
        d = self._sendToWorker(queueItems)
        d.addErrback(vortexLogFailure, logger)

        # Set the watermark
        self._lastQueueId = queueItems[-1].id

        self._queueCount += 1
        self._statusController.setDisplayCompilerStatus(True, self._queueCount)

    @inlineCallbacks
    def _sendToWorker(self, items: List[DispIndexerQueueTable]):
        from peek_plugin_diagram._private.worker.tasks.DispCompilerTask import \
            compileDisps

        queueIds = [o.id for o in items]
        dispIds = list(set([o.dispId for o in items]))
        startTime = datetime.now(pytz.utc)

        # Add the chunks we're processing to the set
        self._chunksInProgress |= set([o.dispId for o in items])

        try:
            yield compileDisps.delay(queueIds, dispIds)
            logger.debug("%s Disps, Time Taken = %s",
                         len(items), datetime.now(pytz.utc) - startTime)

            self._queueCount -= 1

            self._statusController.setDisplayCompilerStatus(True, self._queueCount)
            self._statusController.addToDisplayCompilerTotal(self.ITEMS_PER_TASK)

            # Success, Remove the chunks from the in-progress queue
            self._chunksInProgress -= set([o.dispId for o in items])

        except Exception as e:
            # self._statusController.setDisplayCompilerError(str(e))
            logger.debug("Retrying compile : %s", str(e))
            reactor.callLater(2.0, self._sendToWorker, items)
            return

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._ormSessionCreator()
        try:
            queueItems = (session.query(DispIndexerQueueTable)
                          .order_by(asc(DispIndexerQueueTable.id))
                          .filter(DispIndexerQueueTable.id > self._lastQueueId)
                          .yield_per(self.ITEMS_PER_TASK)
                          .limit(self.ITEMS_PER_TASK)
                          .all())

            session.expunge_all()
            return queueItems
        finally:
            session.close()


    @deferToThreadWrapWithLogger(logger)
    def queueDisps(self, dispIds):
        return self.queueDispIdsToCompile(dispIds, self._ormSessionCreator)

    @classmethod
    def queueDispIdsToCompile(cls, dispIdsToCompile: List[int], ormSessionCreator):
        if not dispIdsToCompile:
            return

        ormSession = ormSessionCreator()
        try:
            cls.queueDispIdsToCompileWithSession(dispIdsToCompile, ormSession)
            ormSession.commit()
        finally:
            ormSession.close()

    @staticmethod
    def queueDispIdsToCompileWithSession(dispIdsToCompile: List[int], ormSessionOrConn):
        if not dispIdsToCompile:
            return

        logger.debug("Queueing %s disps for compile", len(dispIdsToCompile))

        inserts = []
        for dispId in dispIdsToCompile:
            inserts.append(dict(dispId=dispId))

        ormSessionOrConn.execute(DispIndexerQueueTable.__table__.insert(), inserts)
