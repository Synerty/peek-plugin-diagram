import logging
from datetime import datetime
from typing import List

from sqlalchemy import asc
from twisted.internet import task
from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.server.client_handlers.ClientGridUpdateHandler import \
    ClientGridUpdateHandler
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    GridKeyCompilerQueue
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

logger = logging.getLogger(__name__)


class GridKeyCompilerQueueController:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue

    """

    FETCH_SIZE = 5
    PERIOD = 0.200

    def __init__(self, ormSessionCreator,
                 statusController: StatusController,
                 clientGridUpdateHandler: ClientGridUpdateHandler):
        self._ormSessionCreator = ormSessionCreator
        self._statusController: StatusController = statusController
        self._clientGridUpdateHandler: ClientGridUpdateHandler = clientGridUpdateHandler

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = -1
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
        from peek_plugin_diagram._private.worker.tasks.GridKeyCompilerTask import \
            compileGrids

        queueItems = yield self._grabQueueChunk()
        if not queueItems:
            return

        # Set the watermark
        self._lastQueueId = queueItems[-1].id

        queueIdsToDelete = []

        itemsByGridKey = {}
        for i in queueItems:
            if i.gridKey in itemsByGridKey:
                queueIdsToDelete.append(i.id)
            else:
                itemsByGridKey[i.gridKey] = i
                
        queueItems = list(itemsByGridKey.values())

        for start in range(0, len(queueItems), self.FETCH_SIZE):
            items = queueItems[start: start + self.FETCH_SIZE]

            d = compileGrids.delay(items)
            d.addCallback(self._pollCallback, datetime.utcnow(), len(items))
            d.addErrback(self._pollErrback, datetime.utcnow())

        yield self._deleteDuplicateQueueItems(queueIdsToDelete)

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._ormSessionCreator()
        try:
            qry = (session.query(GridKeyCompilerQueue)
                   .order_by(asc(GridKeyCompilerQueue.id))
                   .filter(GridKeyCompilerQueue.id > self._lastQueueId)
                   # .yield_per(self.FETCH_SIZE)
                   # .limit(self.FETCH_SIZE)
                 )

            queueItems = qry.all()
            session.expunge_all()

            return queueItems

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _deleteDuplicateQueueItems(self, itemIds):
        session = self._ormSessionCreator()
        try:
            (session.query(GridKeyCompilerQueue)
             .filter(GridKeyCompilerQueue.id.in_(itemIds))
             .delete(synchronize_session=False))
            session.commit()
        finally:
            session.close()

    def _pollCallback(self, gridKeys: List[str], startTime, processedCount):
        logger.debug("Time Taken = %s" % (datetime.utcnow() - startTime))
        self._clientGridUpdateHandler.sendGrids(gridKeys)
        self._statusController.addToGridCompilerTotal(processedCount)

    def _pollErrback(self, failure, startTime):
        logger.debug("Time Taken = %s" % (datetime.utcnow() - startTime))
        self._statusController.setGridCompilerError(str(failure.value))
        vortexLogFailure(failure, logger)
