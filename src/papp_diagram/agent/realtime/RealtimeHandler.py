import json
from copy import copy

from twisted.internet.defer import inlineCallbacks

from rapui.DeferUtil import deferToThreadWrap
from rapui.vortex.PayloadEndpoint import PayloadEndpoint

from peek_agent.PeekVortexClient import ModData, sendPayloadToPeekServer, \
    sendVortexMsgToPeekServer
from peek_agent_pof.realtime.RealtimePollerEcomFactory import realtimePoller
from rapui.vortex.Payload import Payload

__author__ = 'peek'
'''
Created on 09/07/2014

@author: synerty
'''

import logging

logger = logging.getLogger(__name__)

# -------------------------------------
# Realtime Handler for requests from server


# The filter the server listens on
liveDbAgentServerFilt = {'key': "c.s.p.agent.livedb.server"}  # SEND

# Filter to update the DB in the agent
liveDbAgentDbFilt = {'key': "c.s.p.agent.livedb.db"}  # LISTEN

# Filter to tell the agent which ids to monitor
liveDbAgentMonitorFilt = {'key': "c.s.p.agent.livedb.monitor"}  # LISTEN


class RealtimeHandler(object):
    def __init__(self):
        pass

    def start(self):
        self._ep = PayloadEndpoint(liveDbAgentDbFilt, self._processDbUpdates)
        self._ep = PayloadEndpoint(liveDbAgentMonitorFilt, self._processMonitorIds)

        # First off, Tell the LiveDB that we are here, and get the update list
        sendPayloadToPeekServer(Payload(filt=copy(liveDbAgentServerFilt)))

        return True

    @inlineCallbacks
    def _processDbUpdates(self, payload, vortexUuid, **kwargs):
        if not len(payload.tuples):
            return

        items = yield self._jsonLoad(payload.tuples[0])

        if len(items) == 0:
            logger.info("Live db keys download complete.")
            yield realtimePoller.updateLiveDb(None)
        else:
            logger.debug("Downloaded %s live db keys from Peek server",
                        len(items))
            yield realtimePoller.updateLiveDb(items)

    @deferToThreadWrap
    def _jsonLoad(self, jsonString):
        return json.loads(jsonString)

    def _processMonitorIds(self, payload, vortexUuid, **kwargs):
        logger.debug("Monitoring update received, %s keys.", len(payload.tuples))
        realtimePoller.updateMonitorIds(payload.tuples)

    @inlineCallbacks
    def sendUpdates(self, values):
        vortexMsg = yield self._sendUpdatesInThread(values)
        yield sendVortexMsgToPeekServer(vortexMsg)

    @deferToThreadWrap
    def _sendUpdatesInThread(self, values):
        # First off, Tell the LiveDB that we are here, and get the update list
        payload = Payload(filt=copy(liveDbAgentServerFilt), tuples=values)
        payload.filt['updates'] = True
        return payload.toVortexMsg()

    def sendDownloadComplete(self, downloadTotal):
        # First off, Tell the LiveDB that we are here, and get the update list
        payload = Payload(filt=copy(liveDbAgentServerFilt))
        payload.filt['downloadTotal'] = downloadTotal
        sendPayloadToPeekServer(payload)


realtimeHandler = RealtimeHandler()
