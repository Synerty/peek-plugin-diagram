import logging

from peek.api.agent.grid.AgentImportDispGrid import AgentImportDispGrid
from peek.api.agent.grid.AgentImportDispLiveDbLinks import AgentImportDispLiveDbLinks
from peek.core.live_db.LiveDb import liveDb
from peek.core.orm import getNovaOrmSession
from peek.core.orm.AgentData import AgentImportDispGridInfo
from peek.core.queue_processesors.DispQueueIndexer import dispQueueCompiler

from txhttputil import OrmCrudHandler
from txhttputil import Payload
from txhttputil import PayloadEndpoint
from txhttputil import deferToThreadWrap
from txhttputil import vortexSendPayload

logger = logging.getLogger(__name__)

###############################################################################
agentImportDispGridInfoKey = {'key': "c.s.p.ai.disp_grid_info"}


class __AgentImportLoookupInfoHandler(OrmCrudHandler):
    def _retrieve(self, session, filtId, payloadFilt, obj=None, **kwargs):
        payload = Payload()

        info = obj if obj else self._getDeclarativeById(session, filtId)
        logger.debug("Sending DispGridInfo item with id %s" % obj.id)
        session.expunge(info)
        payload.tuples = [info] if info else []

        self._ext.afterRetrieve(payload.tuples, session, payloadFilt)
        return payload

    def _create(self, session, payloadFilt):
        logger.debug("Sending all DispGridInfo items")

        tuples = session.query(AgentImportDispGridInfo).all()
        for tuple_ in tuples:
            session.expunge(tuple_)

        payload = Payload(tuples=tuples)
        self._ext.afterCreate(payload.tuples, session, payloadFilt)
        return payload


__agentImportLoookupInfoHandler = __AgentImportLoookupInfoHandler(
    getNovaOrmSession,
    AgentImportDispGridInfo,
    agentImportDispGridInfoKey)

###############################################################################
agentImportDispGridFilt = {'key': "c.s.p.import.disp_grid"}  # LISTEN


class __AgentImportDispGridHandler(object):
    def __init__(self, payloadFilter):
        self._ep = PayloadEndpoint(payloadFilter, self._process)

    def _process(self, payload, vortexUuid, **kwargs):
        modelSetName = payload.filt['modelSetName']
        coordSetName = payload.filt.get('coordSetName')

        importGroupHash = payload.filt['importGroupHash']
        infoKey = payload.filt['infoKey']

        logger.debug("Loading disp grid %s" % infoKey)


        disps = payload.tuples

        d = AgentImportDispGrid().importDisps(modelSetName, coordSetName,
                                              importGroupHash, disps)

        successFilt = {'key': "c.s.p.ai.grid_update_success",
                       'infoKey': infoKey,
                       'date': payload.filt['date'],
                       'hash': payload.filt['hash']}

        d.addCallback(self._importDispLinks, importGroupHash, disps)
        d.addCallback(self._sendSuccess, vortexUuid, successFilt)
        d.addCallback(self._queueDispsForCompile, vortexUuid, successFilt)
        d.addCallback(self._sentLiveDbKeysToAgents, vortexUuid, successFilt)

        # Don't return the deferred, we don't want PayloadIO to report how long this takes
        # return d

    def _importDispLinks(self, importDispsDeferResult, importGroupHash, disps):

        # Returned from importDisps
        coordSetId, dispIdsToCompile = importDispsDeferResult

        d = AgentImportDispLiveDbLinks().importDispLiveDbDispLinks(
            coordSetId, importGroupHash, disps)

        # Maintain the deferred result for the next function
        d.addCallback(lambda newLiveDbIds: (dispIdsToCompile, newLiveDbIds))
        return d

    def _sendSuccess(self, importDispsDeferResult, vortexUuid, successFilt):
        logger.debug("Sending disp grid load success for %s", successFilt['infoKey'])

        payload = Payload()
        payload.filt = successFilt
        vortexSendPayload(payload, vortexUuid=vortexUuid)

        return importDispsDeferResult

    @deferToThreadWrap
    def _queueDispsForCompile(self, importDispsDeferResult, vortexUuid, successFilt):
        dispIdsToCompile, newLiveDbIds = importDispsDeferResult

        logger.debug("Queueing disp grids for %s", successFilt['infoKey'])
        dispQueueCompiler.queueDisps(dispIdsToCompile)

        return newLiveDbIds

    @deferToThreadWrap
    def _sentLiveDbKeysToAgents(self, newLiveDbIds, vortexUuid, successFilt):

        logger.debug("Sending new liveDbKeys to agents for %s", successFilt['infoKey'])
        liveDb.registerNewLiveDbKeys(keyIds=newLiveDbIds)

        return True



__agentImportLoookupHandler = __AgentImportDispGridHandler(agentImportDispGridFilt)
