import logging
from datetime import datetime

from sqlalchemy.sql.expression import asc
from twisted.internet import task

from peek.core.orm import getNovaOrmSession
from peek.core.orm.GridKeyIndex import DispIndexerQueue
from rapui.DeferUtil import deferToThreadWrap

logger = logging.getLogger(__name__)


class DispQueueIndexer:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    FETCH_SIZE = 500
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
        queueItems = (session.query(DispIndexerQueue)
                      .filter(DispIndexerQueue.id > self._lastQueueId)
                      .order_by(asc(DispIndexerQueue.id))
                      .yield_per(self.FETCH_SIZE)
                      .limit(self.FETCH_SIZE)
                      .all())

        session.expunge_all()
        session.close()

        if not queueItems:
            return

        self._lastQueueId = queueItems[-1].id
        queueDispIds = list(set([o.dispId for o in queueItems]))

        from proj.DispQueueIndexerTask import compileDisps

        # deferLater, to make it call in the main thread.
        d = compileDisps.delay(self._lastQueueId, queueDispIds)
        d.addCallback(self._callback, datetime.utcnow(), queueDispIds)
        d.addErrback(self._errback)

    def _callback(self, arg, startTime, queueDispIds):
        print datetime.utcnow() - startTime

        session = getNovaOrmSession()
        (session.query(DispIndexerQueue)
         .filter(DispIndexerQueue.id.in_(queueDispIds))
         .delete(synchronize_session=False)
         )

    def _errback(self, failure):
        print failure

    # def queueDisps(self, dispIds, conn=None):
    #     if not dispIds:
    #         return
    #
    #     inserts = []
    #     for dispId in dispIds:
    #         inserts.append(dict(dispId=dispId))
    #
    #     conn = conn if conn else SqlaConn.dbEngine
    #     conn.execute(DispIndexerQueue.__table__.insert(), inserts)



dispQueueCompiler = DispQueueIndexer()

if __name__ == '__main__':
    from twisted.internet import reactor

    dispQueueCompiler.start()
    reactor.run()
