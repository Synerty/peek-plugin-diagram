import logging
from datetime import datetime

from sqlalchemy.sql.expression import asc
from twisted.internet import task
from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.server.queue.GridKeyCompilerQueue import \
    GridKeyCompilerQueue
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    DispIndexerQueue as DispIndexerQueueTable
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

logger = logging.getLogger(__name__)


class DispCompilerQueue:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    FETCH_SIZE = 500
    PERIOD = 0.200

    def __init__(self, ormSessionCreator, gridKeyCompilerQueue: GridKeyCompilerQueue):

        self._ormSessionCreator = ormSessionCreator
        self._gridKeyCompilerQueue = gridKeyCompilerQueue

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._status = False
        self._lastQueueId = 0

    def status(self):
        """ Status
        @:return Either True for running, False or Str for error
        """
        return self._status

    def statusText(self):
        """ Status Text
        @:return A description of the status
        """
        if self._status:
            return "Running"

        if not self._status:
            return "Stopped"

        # Exception
        return "Stopped with error\n" + str(self._status)

    def _errback(self, failure):
        self._status = failure.value

    def _callback(self, _):
        self._status = False

    def start(self):
        self._status = True
        d = self._pollLoopingCall.start(self.PERIOD)
        d.addCallbacks(self._callback, self._errback)
        return d

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
        queueDispIds = list(set([o.dispId for o in queueItems]))

        from peek_plugin_diagram._private.worker.tasks.DispCompilerTask import \
            compileDisps

        # deferLater, to make it call in the main thread.
        d = compileDisps.delay(self._lastQueueId, queueDispIds)
        d.addCallback(self._callback, datetime.utcnow(), queueDispIds)
        d.addErrback(vortexLogFailure, logger, consumeError=True)

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._ormSessionCreator()
        try:
            queueItems = (session.query(DispIndexerQueueTable)
                          .filter(DispIndexerQueueTable.id > self._lastQueueId)
                          .order_by(asc(DispIndexerQueueTable.id))
                          .yield_per(self.FETCH_SIZE)
                          .limit(self.FETCH_SIZE)
                          .all())

            session.expunge_all()
            return queueItems
        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _callback(self, arg, startTime, queueDispIds):
        print(datetime.utcnow() - startTime)

        ormSession = self._ormSessionCreator()
        try:
            (ormSession.query(DispIndexerQueueTable)
             .filter(DispIndexerQueueTable.id.in_(queueDispIds))
             .delete(synchronize_session=False)
             )

        finally:
            ormSession.close()

    def queueDisps(self, dispIds, conn=None):
        if not dispIds:
            return

        inserts = []
        for dispId in dispIds:
            inserts.append(dict(dispId=dispId))

        if conn:
            conn.execute(DispIndexerQueueTable.__table__.insert(), inserts)

        else:
            ormSession = self._ormSessionCreator()
            try:
                ormSession.execute(DispIndexerQueueTable.__table__.insert(), inserts)
                ormSession.commit()
            finally:
                ormSession.close()
