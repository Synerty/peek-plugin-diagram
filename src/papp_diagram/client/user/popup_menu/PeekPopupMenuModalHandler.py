import json
from base64 import b64encode
from copy import copy

from twisted.internet.defer import inlineCallbacks
from twisted.internet.utils import getProcessOutput

from rapui.vortex.Payload import Payload
from rapui.vortex.PayloadEndpoint import PayloadEndpoint
from rapui.vortex.Vortex import vortexSendVortexMsg, vortexSendTuple

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

import logging

logger = logging.getLogger(__name__)

# -------------------------------------
# Software Update Handler for data from agents

# The filter we listen on
modelDispActionPopupMenuFilt = {
    'key': "peek_server.model.disp_action.popup_menu"}  # LISTEN / SEND


class PeekPopupMenuModalHandler(object):
    def __init__(self, payloadFilter):
        self._ep = PayloadEndpoint(payloadFilter, self._process)

    @inlineCallbacks
    def _process(self, payload, vortexUuid, **kwargs):
        actionData = payload.filt['actionData']
        actionDataStr = b64encode(json.dumps(actionData))

        from peek.AppConfig import appConfig
        scriptPath = appConfig.popupMenuScript

        menuData = yield getProcessOutput(scriptPath, [actionDataStr])
        menuData = json.loads(menuData.strip())

        vortexSendTuple(filt=modelDispActionPopupMenuFilt,
                        tuple_=menuData['menuItems'],
                        vortexUuid=vortexUuid)


peekPopupMenuModalHandler = PeekPopupMenuModalHandler(modelDispActionPopupMenuFilt)
