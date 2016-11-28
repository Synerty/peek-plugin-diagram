import logging
from datetime import datetime

from peek.core.orm import getNovaOrmSession, SynSqlaConn
from peek.core.orm.GridKeyIndex import GridKeyIndex
from peek.core.orm.LiveDb import LiveDbDispLink, LiveDbKey
from peek.core.orm.ModelSet import ModelCoordSet
from peek.core.queue_processesors.DispQueueIndexer import dispQueueCompiler

from txhttputil import deferToThreadWrap
from txhttputil import vortexClientIpPort

logger = logging.getLogger(__name__)


class LiveDbStatus(object):
    def __init__(self):
        self.agentStatus = "No agent connected"
        self.downloadStatus = "Not started"
        self.monitorStatus = "Not started"

    @property
    def statusNameValues(self):
        return [("Agent Connection Status", self.agentStatus),
                ("Agent LiveDB Download Status", self.downloadStatus),
                ("Agent LiveDB Monitor Status", self.monitorStatus),
                ]


class LiveDb(object):
    # Singleton
    _instance = None

    AGENT_KEY_SEND_CHUNK = 5000

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(LiveDb, cls).__new__(cls)
            cls._instance.__singleton_init__()
        return cls._instance

    def __singleton_init__(self):
        # self._agents = []
        self._status = LiveDbStatus()
        self._pofAgentVortexUuid = None

    @property
    def statusNameValues(self):
        ip = vortexClientIpPort(self._pofAgentVortexUuid)
        self._status.agentStatus = ("Connected from %s" % ip
                                    if ip else
                                    "No Agent Connected")

        return self._status.statusNameValues

    def registerNewLiveDbKeys(self, keyIds):
        if not keyIds:
            return

        self._sendKeysToAgents(keyIds)

    @deferToThreadWrap
    def setWatchedGridKeys(self, gridKeys):
        session = getNovaOrmSession()
        liveDbKeyIds = [t[0] for t in
                        session.query(LiveDbDispLink.liveDbKeyId)
                            .join(GridKeyIndex,
                                  GridKeyIndex.dispId == LiveDbDispLink.dispId)
                            .filter(GridKeyIndex.gridKey.in_(gridKeys))
                            .yield_per(1000)
                            .distinct()]
        session.close()

        self._status.monitorStatus = "Monitoring %s keys" % len(liveDbKeyIds)

        # Mark the end of chunks.
        from peek.api.agent.livedb.AgentLiveDbHandler import agentLiveDbHandler
        agentLiveDbHandler.sendMonitorIds(liveDbKeyIds, self._pofAgentVortexUuid)

    @deferToThreadWrap
    def addOrUpdateAgent(self, vortexUuid):
        if vortexUuid == self._pofAgentVortexUuid:
            return

        self._pofAgentVortexUuid = vortexUuid

        self._status = LiveDbStatus()

        self._sendKeysToAgents()

    def agentDownloadComplete(self, payload, vortexUuid):
        # if vortexUuid == self._pofAgentVortexUuid:
        #     return

        self._status.downloadStatus = "Download complete"

    def _yieldKeyChunks(self, keyIds):
        if keyIds == []:
            return

        session = getNovaOrmSession()
        qry = (session.query(LiveDbKey)
               .order_by(LiveDbKey.id)
               .yield_per(self.AGENT_KEY_SEND_CHUNK))

        # you can't have filter limit/offset at the same time
        if keyIds is not None:
            qry = qry.filter(LiveDbKey.id.in_(keyIds))

        offset = 0
        while True:
            self._status.downloadStatus = "Sending chunk %s to %s" % (
                offset, self.AGENT_KEY_SEND_CHUNK + offset)

            qry = (qry
                   .offset(offset)
                   .limit(self.AGENT_KEY_SEND_CHUNK))

            liveKeyIds = [o.tupleToSmallJsonDict() for o in qry]
            if not liveKeyIds:
                break

            yield liveKeyIds
            offset += self.AGENT_KEY_SEND_CHUNK

        session.close()

    def _sendKeysToAgents(self, keyIds=None):
        if not self._pofAgentVortexUuid:
            return

        from peek.api.agent.livedb.AgentLiveDbHandler import agentLiveDbHandler

        for keysAsJson in self._yieldKeyChunks(keyIds):
            agentLiveDbHandler.sendDb(keysAsJson, self._pofAgentVortexUuid)

        # Mark the end of chunks.
        agentLiveDbHandler.sendDb([], self._pofAgentVortexUuid)

    @deferToThreadWrap
    def processValueUpdates(self, liveDbKeysJson):
        if not liveDbKeysJson:
            return

        startTime = datetime.utcnow()

        engine = SynSqlaConn.dbEngine
        conn = engine.connect()

        session = getNovaOrmSession()

        from peek.core.data_cache.DispLookupDataCache import dispLookupDataCache

        # FIXME, This won't work for multiple model sets
        defaultCoordSet = session.query(ModelCoordSet).first()
        if not defaultCoordSet:
            logger.error("Agent has sent keys that are no longer valid,"
                         " no coord sets")
            return

        defaultCoordSetId = defaultCoordSet.id
        valueTranslator = dispLookupDataCache.getHandler(defaultCoordSetId)

        liveDbKeyIds = set([v['id'] for v in liveDbKeysJson])

        qry = (session.query(LiveDbDispLink.dispId)
               .filter(LiveDbDispLink.liveDbKeyId.in_(liveDbKeyIds))
               .all())

        dispIdsToCompile = list(set([i[0] for i in qry]))

        session.close()

        logger.debug("Queried for %s dispIds in %s",
                     len(dispIdsToCompile), (datetime.utcnow() - startTime))

        transaction = conn.begin()

        # Map to the disp values, that way we can figure out which lookup to use
        for liveDbKey in liveDbKeysJson:
            liveDbKeyId = liveDbKey['id']

            value = liveDbKey['v']
            dataType = liveDbKey['dt']
            convertedValue = valueTranslator.liveDbValueTranslate(dataType, value)

            conn.execute(LiveDbKey.__table__.update()
                         .where(LiveDbKey.id == liveDbKeyId)
                         .values(value=value, convertedValue=convertedValue))

        dispQueueCompiler.queueDisps(dispIdsToCompile, conn)

        try:
            transaction.commit()
            logger.debug("Applied %s updates, queued %s disps, from agent in %s",
                         len(liveDbKeysJson),
                         len(dispIdsToCompile),
                         (datetime.utcnow() - startTime))

        except Exception as e:
            transaction.rollback()
            logger.critical(e)

        conn.close()


liveDb = LiveDb()
