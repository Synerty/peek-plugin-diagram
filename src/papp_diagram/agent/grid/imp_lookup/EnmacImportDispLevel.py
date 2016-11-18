from peek_agent.orm.Display import DispLevel
from .EnmacImportLookup import EnmacImportLookup
from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession, DeclutterData, getEnmacWorlds


class EnmacImportDispLevel(EnmacImportLookup):
    LOOKUP_NAME=DispLevel.tupleType()

    def _loadTuplesBlocking(self):
        enmacSession = getEnmacSession()

        results = []

        for world in getEnmacWorlds():

            qry = (enmacSession
                   .query(DeclutterData)
                   .filter(DeclutterData.profileName == world.declutterProfile)
                   .order_by(DeclutterData.index))

            items = []

            for enmac in qry:
                item = DispLevel()
                item.name = "Level %s" % enmac.index
                item.importHash = "%s:%s" % (enmac.profileName, enmac.index)
                item.minZoom = enmac.onScale
                item.maxZoom = enmac.offScale
                item.order = enmac.index
                items.append(item)

            results.append((world.name, items))

        enmacSession.close()

        return results
