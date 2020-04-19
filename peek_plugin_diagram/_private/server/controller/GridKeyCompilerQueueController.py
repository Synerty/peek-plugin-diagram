import logging
from datetime import datetime
from typing import List, Any, Set

import pytz
from sqlalchemy import asc, select, bindparam
from twisted.internet import task, reactor, defer
from twisted.internet.defer import inlineCallbacks
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

from peek_plugin_diagram._private.server.client_handlers.ClientGridUpdateHandler import \
    ClientGridUpdateHandler
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    GridKeyCompilerQueue, GridKeyCompilerQueueTuple

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
        self._pausedForDuplicate = None

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
        # If the Queue compiler is paused, then do nothing.
        if self._pausedForDuplicate:
            return

        # We queue the grids in bursts, reducing the work we have to do.
        if self._queueCount > self.QUEUE_MIN:
            return

        # Check for queued items
        queueBlocks = yield self._grabQueueChunk()
        if not queueBlocks:
            return

        for items, itemUniqueIds in queueBlocks:

            # If we're already processing these chunks, then return and try later
            if self._chunksInProgress & itemUniqueIds:
                self._pausedForDuplicate = itemUniqueIds
                return

            # This should never fail
            d = self._sendToWorker(items, itemUniqueIds)
            d.addErrback(vortexLogFailure, logger)

            # Set the watermark
            self._lastQueueId = items[-1].id

            self._queueCount += 1
            if self._queueCount >= self.QUEUE_MAX:
                break

        self._statusController.setGridCompilerStatus(True, self._queueCount)
        yield self._dedupeQueue()

    @inlineCallbacks
    def _sendToWorker(self, items: List[GridKeyCompilerQueue],
                      itemUniqueIds: Set[Any]):
        from peek_plugin_diagram._private.worker.tasks.GridCompilerTask import \
            compileGrids

        startTime = datetime.now(pytz.utc)

        # Add the chunks we're processing to the set
        self._chunksInProgress |= itemUniqueIds

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
            self._chunksInProgress -= itemUniqueIds

            # If the queue compiler was paused for this chunk then resume it.
            if self._pausedForDuplicate and self._pausedForDuplicate & itemUniqueIds:
                self._pausedForDuplicate = None

        except Exception as e:
            if isinstance(e, defer.TimeoutError):
                logger.info("Retrying compile, Task has timed out.")
            else:
                logger.debug("Retrying compile : %s", str(e))

            reactor.callLater(2.0, self._sendToWorker, items, itemUniqueIds)
            return

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        queueTable = GridKeyCompilerQueue.__table__

        toGrab = (self.QUEUE_MAX - self._queueCount) * self.ITEMS_PER_TASK
        session = self._dbSessionCreator()
        try:
            sql = select([queueTable]) \
                .where(queueTable.c.id > bindparam('b_id')) \
                .order_by(asc(queueTable.c.id)) \
                .limit(bindparam('b_toGrab'))

            sqlData = session \
                .execute(sql, dict(b_id=self._lastQueueId, b_toGrab=toGrab)) \
                .fetchall()

            queueItems = [GridKeyCompilerQueueTuple(o.id, o.coordSetId, o.gridKey)
                          for o in sqlData]

            queueBlocks = []
            for start in range(0, len(queueItems), self.ITEMS_PER_TASK):
                items = queueItems[start: start + self.ITEMS_PER_TASK]
                itemUniqueIds = set([o.uniqueId for o in items])
                queueBlocks.append((items, itemUniqueIds))

            return queueBlocks

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _dedupeQueue(self):
        session = self._dbSessionCreator()
        dedupeLimit = self.QUEUE_MAX * self.ITEMS_PER_TASK * 2
        try:
            sql = """
                 with sq_raw as (
                    SELECT "id", "gridKey"
                    FROM pl_diagram."GridKeyCompilerQueue"
                    WHERE id > %(id)s
                    LIMIT %(limit)s
                ), sq as (
                    SELECT min(id) as "minId", "gridKey"
                    FROM sq_raw
                    GROUP BY  "gridKey"
                    HAVING count("gridKey") > 1
                )
                DELETE
                FROM pl_diagram."GridKeyCompilerQueue"
                     USING sq sq1
                WHERE pl_diagram."GridKeyCompilerQueue"."id" != sq1."minId"
                    AND pl_diagram."GridKeyCompilerQueue"."id" > %(id)s
                    AND pl_diagram."GridKeyCompilerQueue"."gridKey" = sq1."gridKey"

            """ % {'id': self._lastQueueId, 'limit': dedupeLimit}

            session.execute(sql)
            session.commit()

        finally:
            session.close()
