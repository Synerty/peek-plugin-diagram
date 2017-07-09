from peek_agent.orm.Display import DispLayer
from .EnmacImportLookup import EnmacImportLookup
from peek_agent_pof.imp_model import EnmacOrm
from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession


class EnmacImportDispLayer(EnmacImportLookup):
    LOOKUP_NAME = DispLayer.tupleType()

    def _loadTuplesBlocking(self):
        from peek_agent_pof.PofAgentConfig import pofAgentConfig
        layerProfileName = pofAgentConfig.layerProfileName

        enmacSession = getEnmacSession()

        # 0 = disbled
        # 1 = enabled but turned off at login_page
        # 2 = enabled and turned on at login_page
        # 3 = current state
        # 4 = normal state

        disabledLayers = set([str(o.index)
                              for o in enmacSession.query(EnmacOrm.LayerProfile)
                             .filter(EnmacOrm.LayerProfile.name == layerProfileName)
                             .filter(EnmacOrm.LayerProfile.status == 0)
                              ])

        turnedOnLayers = set([str(o.index)
                              for o in enmacSession.query(EnmacOrm.LayerProfile)
                             .filter(EnmacOrm.LayerProfile.name == layerProfileName)
                             .filter(EnmacOrm.LayerProfile.status.in_([2, 4]))
                              ])

        qry = (enmacSession
               .query(EnmacOrm.Layers)
               .order_by(EnmacOrm.Layers.id))

        items = []

        for enmac in qry:
            layerIndex = str(enmac.id)
            if layerIndex in disabledLayers:
                continue

            item = DispLayer()
            item.importHash = enmac.id
            item.order = enmac.id
            item.name = enmac.name
            item.visible = layerIndex in turnedOnLayers
            item.selectable = item.visible
            items.append(item)

        enmacSession.close()

        return [(None, items)]
