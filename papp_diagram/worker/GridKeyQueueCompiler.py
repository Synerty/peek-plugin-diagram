import logging
from datetime import datetime

from peek.core.orm import getNovaOrmSession
from peek.core.orm.GridKeyIndex import GridKeyCompilerQueue
from twisted.internet import task

from txhttputil import Payload
from txhttputil import deferToThreadWrap

logger = logging.getLogger(__name__)


class DispQueueIndexer:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    FETCH_SIZE = 15
    PERIOD = 0.200

    def __init__(self):
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
        if self._status == True:
            return "Running"

        if self._status == False:
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

    @deferToThreadWrap
    def _poll(self):

        session = getNovaOrmSession()

        while True:
            qry = (session.query(GridKeyCompilerQueue)
                   .filter(GridKeyCompilerQueue.id > self._lastQueueId)
                   .yield_per(self.FETCH_SIZE)
                   .limit(self.FETCH_SIZE))

            queueItems = qry.all()

            if not queueItems:
                break

            self._lastQueueId = queueItems[-1].id

            from proj.GridKeyQueueCompilerTask import compileGrids

            # deferLater, to make it call in the main thread.
            d = compileGrids.delay(
                Payload(tuples=queueItems).toVortexMsg(compressionLevel=0)
            )
            d.addCallback(self._callback, datetime.utcnow())
            d.addErrback(self._errback)

        session.close()

    def _callback(self, arg, startTime):
        print(datetime.utcnow() - startTime)

    def _errback(self, failure):
        print(failure)


dispQueueCompiler = DispQueueIndexer()

if __name__ == '__main__':
    from twisted.internet import reactor

    dispQueueCompiler.start()
    reactor.run()
