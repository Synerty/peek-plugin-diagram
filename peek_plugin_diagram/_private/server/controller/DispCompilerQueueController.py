import logging
from collections import deque
from datetime import datetime
from typing import List, Deque

import pytz
from numpy.random.common import namedtuple
from sqlalchemy.sql.expression import asc, select, bindparam
from twisted.internet import task, reactor, defer
from twisted.internet.defer import inlineCallbacks
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.DispIndex import \
    DispIndexerQueue as DispIndexerQueueTable

logger = logging.getLogger(__name__)

_DispQueueItem = namedtuple("_DispQueueItem", ["id", "dispId"])

_BlockItem = namedtuple("_QueueItem", ("queueIds", "items", "itemUniqueIds"))


class DispCompilerQueueController:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    ITEMS_PER_TASK = 500
    PERIOD = 0.200

    QUEUE_MAX = 20
    QUEUE_MIN = 4

    TASK_TIMEOUT = 60.0

    def __init__(self, ormSessionCreator, statusController: StatusController):
        self._dbSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._queueCount = 0

        self._queueIdsInBuffer = set()
        self._chunksInProgress = set()

        self._pausedForDuplicate = None
        self._fetchedBlockBuffer: Deque[_BlockItem] = deque()

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
        # If the Queue compiler is paused, then do nothing.
        if self._pausedForDuplicate:
            return

        # We queue the grids in bursts, reducing the work we have to do.
        if self._queueCount > self.QUEUE_MIN:
            return

        fetchedBlocks = yield self._fetchBlocks()
        # Queue the next blocks
        self._fetchedBlockBuffer.extend(fetchedBlocks)

        # If we have nothing to do, exit now
        if not self._fetchedBlockBuffer:
            return

        # Process the block buffer
        while self._fetchedBlockBuffer:
            # Look at the next block to process
            block = self._fetchedBlockBuffer[0]

            # If we're already processing these chunks, then return and try later
            if self._chunksInProgress & block.itemUniqueIds:
                self._pausedForDuplicate = block.itemUniqueIds
                return

            # We're going to process it, remove it from the buffer
            self._fetchedBlockBuffer.popleft()

            # This should never fail
            d = self._sendToWorker(block)
            d.addErrback(vortexLogFailure, logger)

            self._queueCount += 1
            if self._queueCount >= self.QUEUE_MAX:
                break

        self._statusController.setDisplayCompilerStatus(True, self._queueCount)
        yield self._dedupeQueue()

    @inlineCallbacks
    def _sendToWorker(self, block: _BlockItem):
        from peek_plugin_diagram._private.worker.tasks.DispCompilerTask import \
            compileDisps

        startTime = datetime.now(pytz.utc)

        # Add the chunks we're processing to the set
        self._chunksInProgress |= block.itemUniqueIds

        try:
            d = compileDisps.delay(block.queueIds, block.items)
            d.addTimeout(self.TASK_TIMEOUT, reactor)

            yield d
            logger.debug("%s items, Time Taken = %s",
                         len(block.items), datetime.now(pytz.utc) - startTime)

            # Success, Remove the chunks from the in-progress queue
            self._queueCount -= 1
            self._chunksInProgress -= block.itemUniqueIds
            self._queueIdsInBuffer -= set(block.queueIds)

            # If the queue compiler was paused for this chunk then resume it.
            if self._pausedForDuplicate and self._pausedForDuplicate & block.itemUniqueIds:
                self._pausedForDuplicate = None

            # Notify the status controller
            self._statusController.setDisplayCompilerStatus(True, self._queueCount)
            self._statusController.addToDisplayCompilerTotal(len(block.items))

        except Exception as e:
            if isinstance(e, defer.TimeoutError):
                logger.info("Retrying compile, Task has timed out.")
            else:
                logger.debug("Retrying compile : %s", str(e))

            reactor.callLater(2.0, self._sendToWorker, block)
            return

    @deferToThreadWrapWithLogger(logger)
    def _fetchBlocks(self) -> List[_BlockItem]:
        queueTable = DispIndexerQueueTable.__table__

        toGrab = self.QUEUE_MAX - self._queueCount - len(self._fetchedBlockBuffer)
        toGrab *= self.ITEMS_PER_TASK

        session = self._dbSessionCreator()
        try:
            sql = select([queueTable]) \
                .order_by(asc(queueTable.c.id)) \
                .limit(bindparam('b_toGrab'))

            sqlData = session \
                .execute(sql, dict(b_toGrab=toGrab)) \
                .fetchall()

            queueItems = [_DispQueueItem(o.id, o.dispId)
                          for o in sqlData
                          if o.id not in self._queueIdsInBuffer]

            queueBlocks = []
            for start in range(0, len(queueItems), self.ITEMS_PER_TASK):

                queueIds = []
                lastestUpdates = {}
                for item in queueItems[start: start + self.ITEMS_PER_TASK]:
                    queueIds.append(item.id)
                    lastestUpdates[item.dispId] = item.dispId

                itemUniqueIds = set(lastestUpdates.keys())
                items = list(lastestUpdates.values())

                self._queueIdsInBuffer.update(queueIds)

                queueBlocks.append(_BlockItem(queueIds, items, itemUniqueIds))

            return queueBlocks

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def queueDisps(self, dispIds):
        return self.queueDispIdsToCompile(dispIds, self._dbSessionCreator)

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

    @deferToThreadWrapWithLogger(logger)
    def _dedupeQueue(self):
        return
        session = self._dbSessionCreator()
        dedupeLimit = self.QUEUE_MAX * self.ITEMS_PER_TASK * 2
        try:
            sql = """
                 with sq_raw as (
                    SELECT "id", "dispId"
                    FROM pl_diagram."DispCompilerQueue"
                    WHERE id > %(id)s
                    LIMIT %(limit)s
                ), sq as (
                    SELECT min(id) as "minId", "dispId"
                    FROM sq_raw
                    GROUP BY  "dispId"
                    HAVING count("dispId") > 1
                )
                DELETE
                FROM pl_diagram."DispCompilerQueue"
                     USING sq sq1
                WHERE pl_diagram."DispCompilerQueue"."id" != sq1."minId"
                    AND pl_diagram."DispCompilerQueue"."id" > %(id)s
                    AND pl_diagram."DispCompilerQueue"."dispId" = sq1."dispId"
                    
            """ % {'id': self._lastFetchedId, 'limit': dedupeLimit}

            session.execute(sql)
            session.commit()

        finally:
            session.close()
