import logging
from typing import List, Optional

from sqlalchemy import select
from twisted.internet.defer import Deferred
from vortex.DeferUtil import vortexLogFailure, deferToThreadWrapWithLogger
from vortex.Payload import Payload
from vortex.VortexFactory import VortexFactory, NoVortexException

from peek_plugin_base.PeekVortexUtil import peekClientName
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    clientGridUpdateFromServerFilt
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndexCompiled
from peek_plugin_diagram._private.tuples.grid.EncodedGridTuple import EncodedGridTuple

logger = logging.getLogger(__name__)


class ClientGridUpdateHandler:
    """ Client Update Controller

    This controller handles sending updates the the client.

    It uses lower level Vortex API

    It does the following a broadcast to all clients:

    1) Sends grid updates to the clients

    2) Sends Lookup updates to the clients

    """

    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def shutdown(self):
        pass

    def sendGrids(self, gridKeys: List[str]) -> None:
        """ Send Grids

        Send grid updates to the client services

        :param gridKeys: A list of grid keys that this client is observing.
                            the grids are sent to the requesting client only.
        :returns: Nothing
        """

        if not gridKeys:
            return

        if peekClientName not in VortexFactory.getRemoteVortexName():
            logger.debug("No clients are online to send the grid to, %s", gridKeys)
            return

        def send(vortexMsg: Optional[bytes]):
            if vortexMsg:
                VortexFactory.sendVortexMsg(
                    vortexMsg, destVortexName=peekClientName
                )

        d: Deferred = self._loadChunks(gridKeys)
        d.addCallback(send)
        d.addErrback(self._sendGridsErrback, gridKeys)

    def _sendGridsErrback(self, failure, gridKeys):

        if failure.check(NoVortexException):
            logger.debug(
                "No clients are online to send the grid to, %s", gridKeys)
            return

        vortexLogFailure(failure, logger)

    @deferToThreadWrapWithLogger(logger)
    def _loadChunks(self, chunkKeys: List[str]) -> Optional[bytes]:
        table = GridKeyIndexCompiled.__table__
        session = self._dbSessionCreator()
        try:
            sql = select([table]) .where(table.c.gridKey.in_(chunkKeys))
            sqlData = session.execute(sql).fetchall()

            results: List[EncodedGridTuple] = []
            for ormGrid in sqlData:
                results.append(
                    EncodedGridTuple(gridKey=ormGrid.gridKey,
                                     encodedGridTuple=ormGrid.encodedGridTuple,
                                     lastUpdate=ormGrid.lastUpdate)
                )

            if not results:
                return None

            return Payload(
                filt=clientGridUpdateFromServerFilt, tuples=results
            ).makePayloadEnvelope(compressionLevel=3).toVortexMsg()

        finally:
            session.close()
