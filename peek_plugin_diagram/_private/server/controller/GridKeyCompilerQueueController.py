import logging
from datetime import datetime
from typing import List

import pytz
from peek_plugin_diagram._private.server.client_handlers.ClientGridUpdateHandler import \
    ClientGridUpdateHandler
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    GridKeyCompilerQueue
from sqlalchemy import asc
from twisted.internet import task, reactor, defer
from twisted.internet.defer import inlineCallbacks
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

logger = logging.getLogger(__name__)


class GridKeyCompilerQueueController:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue

    """

    ITEMS_PER_TASK = 5
    PERIOD = 0.200

    QUEUE_MAX = 100
    QUEUE_MIN = 30

    TASK_TIMEOUT = 60.0

    def __init__(self, ormSessionCreator,
                 statusController: StatusController,
                 clientGridUpdateHandler: ClientGridUpdateHandler):
        self._dbSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController
        self._clientGridUpdateHandler: ClientGridUpdateHandler = clientGridUpdateHandler

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = -1
        self._queueCount = 0

        self._chunksInProgress = set()

    def start(self):
        self._statusController.setGridCompilerStatus(True, self._queueCount)
        d = self._pollLoopingCall.start(self.PERIOD, now=False)
        d.addCallbacks(self._timerCallback, self._timerErrback)

    def isBusy(self) -> bool:
        return self._queueCount != 0

    def _timerErrback(self, failure):
        vortexLogFailure(failure, logger)
        self._statusController.setGridCompilerStatus(False, self._queueCount)
        self._statusController.setGridCompilerError(str(failure.value))

    def _timerCallback(self, _):
        self._statusController.setGridCompilerStatus(False, self._queueCount)

    def stop(self):
        if self._pollLoopingCall.running:
            self._pollLoopingCall.stop()

    def shutdown(self):
        self.stop()

    @inlineCallbacks
    def _poll(self):

        # We queue the grids in bursts, reducing the work we have to do.
        if self._queueCount > self.QUEUE_MIN:
            return

        # Check for queued items
        queueItems = yield self._grabQueueChunk()
        if not queueItems:
            return

        # Send the tasks to the peek worker
        for start in range(0, len(queueItems), self.ITEMS_PER_TASK):

            items = queueItems[start: start + self.ITEMS_PER_TASK]

            # If we're already processing these chunks, then return and try later
            if self._chunksInProgress & set([o.gridKey for o in items]):
                return

            # This should never fail
            d = self._sendToWorker(items)
            d.addErrback(vortexLogFailure, logger)

            # Set the watermark
            self._lastQueueId = items[-1].id

            self._queueCount += 1
            if self._queueCount >= self.QUEUE_MAX:
                break

        yield self._dedupeQueue()

    @inlineCallbacks
    def _sendToWorker(self, items: List[GridKeyCompilerQueue]):
        from peek_plugin_diagram._private.worker.tasks.GridCompilerTask import \
            compileGrids

        startTime = datetime.now(pytz.utc)

        # Add the chunks we're processing to the set
        self._chunksInProgress |= set([o.gridKey for o in items])

        try:
            d = compileGrids.delay(items)
            d.addTimeout(self.TASK_TIMEOUT, reactor)

            gridKeys = yield d
            logger.debug("Time Taken = %s" % (datetime.now(pytz.utc) - startTime))

            self._queueCount -= 1

            self._clientGridUpdateHandler.sendGrids(gridKeys)
            self._statusController.addToGridCompilerTotal(len(items))
            self._statusController.setGridCompilerStatus(True, self._queueCount)

            # Success, Remove the chunks from the in-progress queue
            self._chunksInProgress -= set([o.gridKey for o in items])

        except Exception as e:
            if isinstance(e, defer.TimeoutError):
                logger.info("Retrying compile, Task has timed out.")
            else:
                logger.debug("Retrying compile : %s", str(e))

            reactor.callLater(2.0, self._sendToWorker, items)
            return

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._dbSessionCreator()
        try:
            qry = (session.query(GridKeyCompilerQueue)
                   .order_by(asc(GridKeyCompilerQueue.id))
                   .filter(GridKeyCompilerQueue.id > self._lastQueueId)
                   .yield_per(self.QUEUE_MAX)
                   .limit(self.QUEUE_MAX)
                   )

            queueItems = qry.all()
            session.expunge_all()

            # Deduplicate the values and return the ones with the lowest ID
            return list({o.gridKey: o for o in reversed(queueItems)}.values())

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _dedupeQueue(self):
        session = self._dbSessionCreator()
        try:
            session.execute("""
                with sq as (
                    SELECT min(id) as "minId"
                    FROM pl_diagram."GridKeyCompilerQueue"
                    WHERE id > %s
                    GROUP BY "coordSetId", "gridKey"
                )
                DELETE
                FROM pl_diagram."GridKeyCompilerQueue"
                WHERE "id" not in (SELECT "minId" FROM sq)
            """ % self._lastQueueId)
            session.commit()
        finally:
            session.close()
