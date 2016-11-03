from peek.core.orm.ModelSet import ModelSet
from rapui.handler.ModelHandler import ModelHandler

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

from peek.core.orm import getNovaOrmSession

import logging

logger = logging.getLogger(__name__)

dxfModelNodeTypesFilt = {"c.s.mod.modelset.node.types.lookup": None}
dxfModelConnTypesFilt = {"c.s.mod.modelset.conn.types.lookup": None}


class __LookupNodeTypes(ModelHandler):
    def buildModel(self, payloadFilt, vortexUuid, session):
        modelSet = (getNovaOrmSession()
                    .query(ModelSet)
                    #.filter(ModelSet.name == ExtractAuroraDunedinModel.MODEL_SET_NAME)
                    .one())

        return [{'id': o.id, 'name': o.name} for o in modelSet.nodeTypes]


__lookupNodeTypes = __LookupNodeTypes(dxfModelNodeTypesFilt)


class __LookupConnTypes(ModelHandler):
    def buildModel(self, payloadFilt, vortexUuid, session):
        modelSet = (getNovaOrmSession()
                    .query(ModelSet)
                    #.filter(ModelSet.name == ExtractAuroraDunedinModel.MODEL_SET_NAME)
                    .one())

        return [{'id': o.id, 'name': o.name} for o in modelSet.connTypes]


__lookupConnTypes = __LookupConnTypes(dxfModelConnTypesFilt)
