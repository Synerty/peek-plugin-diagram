from peek.core.live_db.LiveDb import liveDb
from peek.core.orm.GridKeyIndex import GridKeyIndex
from peek.core.orm.LiveDb import LiveDbDispLink, LiveDbKey
from twisted.internet import reactor
from twisted.internet.threads import deferToThread

from txhttputil import AsyncModelHandler
from txhttputil import Payload
from txhttputil import vortexSendVortexMsg

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''
from sqlalchemy.orm import joinedload
from peek.core.orm import getNovaOrmSession


import logging

logger = logging.getLogger(__name__)


# ModelSet HANDLER
class PeekUiLiveDbHandler(AsyncModelHandler):
    def buildModel(self, **kwargs):
        return deferToThread(self.buildModelBlocking, **kwargs)

    def buildModelBlocking(self, receivedPayload=None, vortexUuid=None, **kwargs):
        session = getNovaOrmSession()
        liveLbDispLinks = (session.query(LiveDbDispLink)
                           .join(LiveDbKey)
                           .join(GridKeyIndex,
                                 LiveDbDispLink.dispId == GridKeyIndex.dispId)
                           .filter(GridKeyIndex.gridKey.in_(receivedPayload.tuples))
                           .filter(LiveDbKey.liveDbKey != None)
                           .options(joinedload(LiveDbDispLink.liveDbKey))
                           .all())
        session.expunge_all()
        reactor.callLater(0, liveDb.updateWantedData, liveLbDispLinks, vortexUuid)

    def sendUpdates(self, liveDbLinkJsonTuples, vortexUuid=None):
        p = Payload(filt={'key': "c.s.p.ui.livedb.updates"},
                    tuples=liveDbLinkJsonTuples)
        vortexSendVortexMsg(p.toVortexMsg(), vortexUuid=vortexUuid)


# dispFilt = {'key': "c.s.p.ui.livedb.source"}
# peekUiLiveDbHandler = PeekUiLiveDbHandler(dispFilt)
