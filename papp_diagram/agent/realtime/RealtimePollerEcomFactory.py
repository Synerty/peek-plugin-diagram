import logging

from twisted.internet import task
from twisted.internet import reactor
from twisted.internet.error import ConnectionDone
from twisted.internet.protocol import Protocol, ClientFactory, connectionDone

from peek_agent_pof.realtime.RealtimePollerEcomProtocol import \
    RealtimePollerEcomProtocolPoller
from peek_agent_pof.realtime.RealtimePollerEcomProtocol import \
    RealtimePollerEcomProtocolWatcher
from peek_agent_pof.realtime.RealtimeValue import RealtimeValue

logger = logging.getLogger(__name__)

RECONNECT_TIMEOUT = 5.000


class RealtimePollerEcomController(object):
    def __init__(self):
        self._watcherFactory = RealtimePollerEcomFactoryWatcher()
        self._pollerFactory = RealtimePollerEcomFactoryPoller()
        self._realTimeValuesByKey = {}
        self._realTimeValuesById = {}
        self.keysToRegister = []
        self.allKeys = []

    def updateLiveDb(self, liveDbs):
        if liveDbs is None:
            self.allKeys = list(self._realTimeValuesByKey.values())
            self._pollerFactory.startPolling()

            # End of bulk load
            from peek_agent_pof.realtime.RealtimeHandler import realtimeHandler
            realtimeHandler.sendDownloadComplete(len(self._realTimeValuesByKey))
            return

        for liveDb in liveDbs:
            realtimeValue = RealtimeValue(liveDb)
            if not realtimeValue.key in self._realTimeValuesByKey:
                self._realTimeValuesByKey[realtimeValue.key] = realtimeValue
                self._realTimeValuesById[realtimeValue.id_] = realtimeValue

    def updateMonitorIds(self, monitorIds):
        # Determine list of keys to register
        self.keysToRegister = []
        for monitorId in monitorIds:
            realtimeValue = self._realTimeValuesById.get(monitorId)
            if realtimeValue:
                self.keysToRegister.append(realtimeValue.key)

        if len(monitorIds) != len(self.keysToRegister):
            logging.info("We are missing %s LiveDbKeys for the monitor request",
                         len(monitorIds) - len(self.keysToRegister))

        self._watcherFactory.registerWatchedAttributes()

        # ----------


class RealtimePollerEcomFactory(ClientFactory):
    def __init__(self):
        self._lastProtocolId = None
        self._protocol = None
        self._reconnectInProgress = False
        self.lastRotateKeyIndex = 0

    @property
    def keysToRegister(self):
        return realtimePoller.keysToRegister

    @property
    def allKeys(self):
        return realtimePoller.allKeys

    @property
    def _realTimeValuesByKey(self):
        return realtimePoller._realTimeValuesByKey

    @property
    def _realTimeValuesById(self):
        return realtimePoller._realTimeValuesById

    # ----------
    # Factory implementation
    def startedConnecting(self, connector):
        logger.debug('%s Started to connect.', self.name)

    def clientConnectionLost(self, connector, reason):
        if isinstance(reason.value, ConnectionDone):
            if self._protocol and self._protocol.id == self._lastProtocolId:
                logger.error('%s connection closed by ewebmon, reconnecting', self.name)
                self.reconnectAfterTimeout()
            else:
                logger.debug('%s Old connection closed cleanly', self.name)

        else:
            logger.info('%s Connection closed, reason : %s', self.name, reason.value)
            self.reconnectAfterTimeout()

    def clientConnectionFailed(self, connector, reason):
        logger.info('%s Connection failed,  Reason: %s', self.name, reason)
        self.reconnectAfterTimeout()

    # ----------
    # Reconnection methods
    def reconnectAfterTimeout(self):
        if self._reconnectInProgress:
            return

        self._reconnectInProgress = True
        logger.info('%s Connecting after %ss', self.name, RECONNECT_TIMEOUT)
        reactor.callLater(RECONNECT_TIMEOUT, self._reconnectAfterTimeoutCallback)

    def _reconnectAfterTimeoutCallback(self):
        self._reconnect()
        self._reconnectInProgress = False

    def disconnect(self):
        if self._protocol:
            self._protocol.transport.loseConnection()
        self._protocol = None
        self._lastProtocolId = None

    def reconnect(self):
        if self._reconnectInProgress:
            return
        self._reconnect()

    def _reconnect(self):
        self.disconnect()
        logger.info('%s Reconnecting', self.name)

        from peek_agent_pof.PofAgentConfig import pofAgentConfig
        reactor.connectTCP(pofAgentConfig.ewebmonServerHost,
                           pofAgentConfig.ewebmonServerPort, self)


class RealtimePollerEcomFactoryPoller(RealtimePollerEcomFactory):
    name = "Poller"

    def buildProtocol(self, addr):
        logger.info('%s Connected.', self.name)
        self._protocol = RealtimePollerEcomProtocolPoller(self)
        self._lastProtocolId = self._protocol.id
        return self._protocol

    def startPolling(self):
        if not self._protocol:
            self.reconnectAfterTimeout()


class RealtimePollerEcomFactoryWatcher(RealtimePollerEcomFactory):
    name = "Watcher"

    def buildProtocol(self, addr):
        logger.info('%s Connected.', self.name)
        self._protocol = RealtimePollerEcomProtocolWatcher(self)
        self._lastProtocolId = self._protocol.id
        return self._protocol

    def registerWatchedAttributes(self):
        if self._protocol:
            self._protocol.registerWatchedAttributes()
        else:
            self.reconnectAfterTimeout()


realtimePoller = RealtimePollerEcomController()
