'''
Created on 09/07/2014

@author: synerty
'''
from peek.core.orm import getNovaOrmSession
from peek.core.orm.ModelSet import ModelCoordSet
from twisted.internet import reactor

from txhttputil import OrmCrudHandler, OrmCrudHandlerExtension

executeListDataKey = {'key':"peakadm.coordset.list.data"}


class CoordSetListHandler(OrmCrudHandler):
    pass

coordSetListHandler = CoordSetListHandler(getNovaOrmSession,
                                          ModelCoordSet,
                                          executeListDataKey,
                                          retreiveAll=True)

@coordSetListHandler.addExtension(ModelCoordSet)
class _CoordSetListHandlerExtension(OrmCrudHandlerExtension):

    def afterUpdateCommit(self, tuple_, tuples, session, payloadFilt):
        from peek.api.client.ClientGridHandler import clientGridHandler
        reactor.callLater(0.0, clientGridHandler.reload)
        return True