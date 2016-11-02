import json

from peek.core.live_db.LiveDb import liveDb

from rapui.vortex.Payload import Payload
from rapui.vortex.Vortex import vortexSendVortexMsg
from rapui.vortex.PayloadEndpoint import PayloadEndpoint

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

import logging

logger = logging.getLogger(__name__)

# -------------------------------------
# LiveDB Handler for data from agents

# The filter we listen on
liveDbAgentServerFilt = {'key': "c.s.p.agent.livedb.server"}  # LISTEN

# Filter to update the DB in the agent
liveDbAgentDbFilt = {'key': "c.s.p.agent.livedb.db"}  # SEND

# Filter to tell the agent which ids to monitor
liveDbAgentMonitorFilt = {'key': "c.s.p.agent.livedb.monitor"}  # SEND


class LiveDbAgentHandler(object):
    def __init__(self, payloadFilter):
        self._ep = PayloadEndpoint(payloadFilter, self._process)

    def _process(self, payload, vortexUuid, **kwargs):
        if "updates" in payload.filt:
            liveDb.processValueUpdates(payload.tuples)
        elif "downloadTotal" in payload.filt:
            liveDb.agentDownloadComplete(payload.filt['downloadTotal'], vortexUuid)
        else:
            liveDb.addOrUpdateAgent(vortexUuid)

    def sendDb(self, keysAsJson, vortexUuid):
        payload = Payload(filt=liveDbAgentDbFilt, tuples=[json.dumps(keysAsJson)])
        vortexSendVortexMsg(payload.toVortexMsg(), vortexUuid)

    def sendMonitorIds(self, monitorIds, vortexUuid):
        payload = Payload(filt=liveDbAgentMonitorFilt, tuples=monitorIds)
        vortexSendVortexMsg(payload.toVortexMsg(), vortexUuid)


agentLiveDbHandler = LiveDbAgentHandler(liveDbAgentServerFilt)
