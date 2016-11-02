import hashlib
import logging
from datetime import datetime

from twisted.internet.defer import inlineCallbacks
from twisted.internet.threads import deferToThread

from peek_agent.PeekVortexClient import sendPayloadToPeekServer, sendVortexMsgToPeekServer
from peek_agent.orm.AgentData import AgentImportLookupInfo
from rapui.vortex.Payload import Payload
from rapui.vortex.PayloadEndpoint import PayloadEndpoint

logger = logging.getLogger(__name__)


class EnmacImportLookup(object):
    LOOKUP_NAME = None

    def __init__(self):
        self._lookupInfoByKey = {}
        self._infoLoaded = False

        self._infoFilt = {'key': "c.s.p.ai.lookup_info",
                          'lookupTupleType': self.LOOKUP_NAME}

        self._infoEndpoint = PayloadEndpoint(self._infoFilt, self._loadInfoTuples)

        self._pushSuccess = {'key': "c.s.p.ai.lookup_update_success",
                             'lookupTupleType': self.LOOKUP_NAME}

        self._successEndpoint = PayloadEndpoint(self._pushSuccess, self._updateLookupInfo)

        payload = Payload()
        payload.filt = self._infoFilt
        sendPayloadToPeekServer(payload)

    def _loadInfoTuples(self, payload, **kwargs):
        logger.debug("Loading lookup info items for %s" % self.LOOKUP_NAME)

        for tuple_ in payload.tuples:
            tuple_.updateInProgressDate = None
            key = "%s:%s" % (tuple_.lookupTupleName, tuple_.coordSetName)
            self._lookupInfoByKey[key] = tuple_

        def loadSuccess(_):
            self._infoLoaded = True

        d = self.import_(firstRun=True)
        d.addCallback(loadSuccess)


    @inlineCallbacks
    def import_(self, firstRun=False):
        if not self._infoLoaded and not firstRun:
            return

        coordSetTuples = yield self._loadTuples()

        for coordSetName, tuples in coordSetTuples:
            hasher = hashlib.md5()

            for tuple_ in tuples:
                hasher.update(str(tuple_))

            hash = hasher.hexdigest()
            date = datetime.utcnow()

            info = yield self._getInfo(coordSetName)

            if info.lastImportHash == hash:
                continue

            if info.updateInProgressDate is not None:
                diffSeconds = (datetime.utcnow() - info.updateInProgressDate).seconds
                if diffSeconds < 60:
                    continue

            info.updateInProgressDate = datetime.utcnow()

            infoKey = "%s:%s" % (self.LOOKUP_NAME, coordSetName)

            # We only want to mark the send successful if the
            vortexMsg = yield self._createPayload(infoKey, date, hash, tuples,
                                                  coordSetName)

            logger.debug("Sending lookup update payload for %s" % self.LOOKUP_NAME)
            sendVortexMsgToPeekServer(vortexMsg)

    def _getInfo(self, coordSetName):
        key = "%s:%s" % (self.LOOKUP_NAME, coordSetName)

        if key in self._lookupInfoByKey:
            return self._lookupInfoByKey[key]

        info = AgentImportLookupInfo(lookupTupleName=self.LOOKUP_NAME,
                                     coordSetName=coordSetName)
        self._lookupInfoByKey[key] = info
        return info

    def _updateLookupInfo(self, payload, *args, **kwargs):
        logger.debug("Recieved update success for lookup %s" % self.LOOKUP_NAME)

        info = self._lookupInfoByKey[payload.filt['infoKey']]
        info.lastImportHash = payload.filt['hash']
        info.lastImportDate = payload.filt['date']
        # info.updateInProgressDate = None

        payload = Payload()
        payload.filt = self._infoFilt
        payload.tuples = [info]
        sendPayloadToPeekServer(payload)

    def _createPayload(self, infoKey, date, hash, tuples, coordSetName):
        return deferToThread(self._createPayloadBlocking, infoKey, date, hash, tuples,
                             coordSetName)

    def _createPayloadBlocking(self, infoKey, date, hash, tuples, coordSetName):
        from peek_agent_pof.PofAgentConfig import pofAgentConfig

        payload = Payload()
        payload.filt['lookupTupleType'] = self.LOOKUP_NAME
        payload.filt['modelSetName'] = pofAgentConfig.modelSetName
        payload.filt['infoKey'] = infoKey
        payload.filt['date'] = date
        payload.filt['hash'] = hash
        if coordSetName:
            payload.filt['coordSetName'] = coordSetName

        payload.filt['key'] = "c.s.p.import.lookup"

        payload.tuples = tuples

        return payload.toVortexMsg()

    def _loadTuples(self):
        return deferToThread(self._loadTuplesBlocking)

    def _loadTuplesBlocking(self):
        """ Load Tuples
        @:returns [(coordSetName, tuples)]
        """
        raise NotImplementedError()
