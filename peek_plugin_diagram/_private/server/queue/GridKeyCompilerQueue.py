import logging
from datetime import datetime

from twisted.internet import task
from twisted.internet.defer import inlineCallbacks

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

    def __init__(self, ormSessionCreator):
        self._ormSessionCreator = ormSessionCreator
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

        from peek_plugin_diagram._private.worker.tasks.GridKeyCompilerTask import compileGrids

        # deferLater, to make it call in the main thread.
        d = compileGrids.delay(
            Payload(tuples=queueItems).toVortexMsg(compressionLevel=0)
        )
        d.addCallback(self._callback, datetime.utcnow())
        d.addErrback(vortexLogFailure, logger, consumeError=True)

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

    def _callback(self, arg, startTime):
        logger.debug("Time Taken = %s" % (datetime.utcnow() - startTime))


