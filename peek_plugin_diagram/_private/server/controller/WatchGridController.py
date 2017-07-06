class WatchGridController:
    """ Watch Grid Controller

    This controller handles the logic involved in the grid watch mechanism.

    That is :

    1) Informing the LiveDB that the keys are being watched

    2) Sending updates for these watched grids to the clients (???? is this the right spot?)
    """


    @deferToThreadWrapWithLogger(logger)
    def setWatchedGridKeys(self, gridKeys):
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

