'''
Created on 09/07/2014

@author: synerty
'''
from sqlalchemy.orm import subqueryload
from peek.core.orm import getNovaOrmSession
from peek.core.orm.ModelSet import ModelSet
from rapui.handler.ModelHandler import ModelHandler

modelSetListDataKey = "c.s.s.p.modelset.list.data"

class PeekModelSetListHandler(ModelHandler):
    def buildModel(self, payloadFilt, **kwargs):
        session = getNovaOrmSession()

        data = (session.query(ModelSet)
               .options(subqueryload(ModelSet.coordSets))
               .all())

        for modelSet in data:
            modelSet.uiData = {
                'coordSets': [cs for cs in modelSet.coordSets if cs.enabled]}

        session.expunge_all()
        session.close()
        return data


peekModelSetListHandler = PeekModelSetListHandler({'key':modelSetListDataKey})
