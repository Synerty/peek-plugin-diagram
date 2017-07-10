from typing import List

import logging

from twisted.internet import defer
from twisted.internet.defer import Deferred

from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC
from vortex.DeferUtil import deferToThreadWrapWithLogger

logger = logging.getLogger(__name__)

class LiveDbWatchController:
    """ Watch Grid Controller

    This controller handles the logic involved in the grid watch mechanism.

    That is :

    1) Informing the LiveDB that the keys are being watched

    2) Sending updates for these watched grids to the clients (???? is this the right spot?)
    """

    def __init__(self, liveDbWriteApi:LiveDBWriteApiABC, dbSessionCreator):
        self._liveDbWriteApi = liveDbWriteApi
        self._dbSessionCreator = dbSessionCreator

    def shutdown(self):
        pass

    def updateClientWatchedGrids(self, clientId: str, gridKeys: List[str]) -> Deferred:
        """ Update Client Watched Grids

        Tell the server that these grids are currently being watched by users.

        :param clientId: A unique identifier of the client (Maybe it's vortex uuid)
        :param gridKeys: A list of grid keys that this client is observing.
        :returns: Nothing
        """
        logger.debug("TODO TODO TODO TODO  Notify the livedb to prioritise the keys")
        # d = self._liveDbWatchController.updateClientWatchedGrids(clientId, gridKeys)
        # d.addErrback(vortexLogFailure, logger, consumeError=True)
        return defer.succeed(True)


    @deferToThreadWrapWithLogger(logger)
    def xxxxsetWatchedGridKeys(self, gridKeys):

        session = self._dbSessionCreator()
        try:
            liveDbKeyIds = [t[0] for t in
                            session.query(LiveDbDispLink.liveDbKeyId)
                                .join(GridKeyIndex,
                                      GridKeyIndex.dispId == LiveDbDispLink.dispId)
                                .filter(GridKeyIndex.gridKey.in_(gridKeys))
                                .yield_per(1000)
                                .distinct()]
        finally:
            session.close()

        self._status.monitorStatus = "Monitoring %s keys" % len(liveDbKeyIds)

        # Mark the end of chunks.
        from peek.api.agent.livedb.AgentLiveDbHandler import agentLiveDbHandler
        agentLiveDbHandler.sendMonitorIds(liveDbKeyIds, self._pofAgentVortexUuid)

