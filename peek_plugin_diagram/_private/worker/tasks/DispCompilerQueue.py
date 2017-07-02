import logging
from datetime import datetime

from sqlalchemy.sql.expression import asc
from twisted.internet import task
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

    @deferToThreadWrapWithLogger(logger)
    def _poll(self):

        session = self._ormSessionCreator()
        try:
            queueItems = (session.query(DispCompilerQueue)
                          .filter(DispCompilerQueue.id > self._lastQueueId)
                          .order_by(asc(DispCompilerQueue.id))
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
            d.addErrback(vortexLogFailure, logger, consumeError=True)

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _callback(self, arg, startTime, queueDispIds):
        print(datetime.utcnow() - startTime)

        session = self._ormSessionCreator()
        try:
            session = getNovaOrmSession()
            (session.query(DispCompilerQueue)
             .filter(DispCompilerQueue.id.in_(queueDispIds))
             .delete(synchronize_session=False)
             )

        finally:
            session.close()


    # def queueDisps(self, dispIds, conn=None):
    #     if not dispIds:
    #         return
    #
    #     inserts = []
    #     for dispId in dispIds:
    #         inserts.append(dict(dispId=dispId))
    #
    #     conn = conn if conn else SqlaConn.dbEngine
    #     conn.execute(DispCompilerQueue.__table__.insert(), inserts)


