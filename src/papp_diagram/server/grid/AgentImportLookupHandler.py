import logging

from peek.api.agent.grid.AgentImportLookup import AgentImportLookup
from peek.core.orm import getNovaOrmSession
from peek.core.orm.AgentData import AgentImportLookupInfo

from txhttputil import OrmCrudHandler
from txhttputil import Payload
from txhttputil import PayloadEndpoint
from txhttputil import vortexSendPayload

logger = logging.getLogger(__name__)

###############################################################################
agentImportLookupInfoKey = {'key': "c.s.p.ai.lookup_info"}


class __AgentImportLoookupInfoHandler(OrmCrudHandler):
    def _retrieve(self, session, filtId, payloadFilt, obj=None, **kwargs):
        payload = Payload()

        info = obj if obj else self._getDeclarativeById(session, filtId)
        logger.debug("Sending lookup info item with id %s" % obj.id)
        session.expunge(info)
        payload.tuples = [info] if info else []

        self._ext.afterRetrieve(payload.tuples, session, payloadFilt)
        return payload

    def _create(self, session, payloadFilt):
        tupleType = payloadFilt['lookupTupleType']
        logger.debug("Sending lookup info items for %s" % tupleType)

        tuples = (session.query(AgentImportLookupInfo)
                  .filter(AgentImportLookupInfo.lookupTupleName == tupleType)
                  .all())
        for tuple_ in tuples:
            session.expunge(tuple_)

        payload = Payload(tuples=tuples)
        self._ext.afterCreate(payload.tuples, session, payloadFilt)
        return payload


__agentImportLoookupInfoHandler = __AgentImportLoookupInfoHandler(
    getNovaOrmSession,
    AgentImportLookupInfo,
    agentImportLookupInfoKey)

###############################################################################
agentImportLookupFilt = {'key': "c.s.p.import.lookup"}  # LISTEN


class __AgentImportLookupHandler(object):
    def __init__(self, payloadFilter):
        self._ep = PayloadEndpoint(payloadFilter, self._process)

    def _process(self, payload, vortexUuid, **kwargs):
        modelSetName = payload.filt['modelSetName']
        coordSetName = payload.filt.get('coordSetName')

        lookupTupleType = payload.filt['lookupTupleType']

        logger.debug("Loading lookups for %s" % lookupTupleType)

        d = AgentImportLookup().import_(modelSetName, coordSetName,
                                        lookupTupleType, payload.tuples)

        successFilt = {'key': "c.s.p.ai.lookup_update_success",
                       'lookupTupleType': lookupTupleType,
                       'infoKey': payload.filt['infoKey'],
                       'date': payload.filt['date'],
                       'hash': payload.filt['hash']}

        d.addCallback(self._sendSuccess, vortexUuid, successFilt)
        return d

    def _sendSuccess(self, deferArg, vortexUuid, successFilt):
        from peek.core.data_cache.DispLookupDataCache import dispLookupDataCache
        dispLookupDataCache.refreshAll()

        logger.debug("Sending lookup load success for %s", successFilt['infoKey'])

        payload = Payload()
        payload.filt = successFilt
        vortexSendPayload(payload, vortexUuid=vortexUuid)


__agentImportLoookupHandler = __AgentImportLookupHandler(agentImportLookupFilt)
