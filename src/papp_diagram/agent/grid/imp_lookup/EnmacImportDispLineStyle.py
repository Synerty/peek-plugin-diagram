from peek_agent.orm.Display import DispLineStyle
from EnmacImportLookup import EnmacImportLookup
from peek_agent_pof.imp_model import EnmacOrm
from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession


class EnmacImportDispLineStyle(EnmacImportLookup):
    LOOKUP_NAME=DispLineStyle.tupleType()

    def _loadTuplesBlocking(self):
        enmacSession = getEnmacSession()
        qry = (enmacSession
               .query(EnmacOrm.LineStyles)
               .order_by(EnmacOrm.LineStyles.id))

        items = []

        for enmac in qry:
            item = DispLineStyle()
            item.name = enmac.name
            item.importHash = enmac.id
            item.backgroundFillDashSpace = enmac.type == 2
            item.capStyle = {0: 'butt',
                             1: 'butt',
                             2: 'round',
                             3: 'square'}[enmac.capStyle]
            item.joinStyle = {0: 'bevel',
                              1: 'round',
                              2: 'miter',}[enmac.joinStyle]
            item.startArrowSize = enmac.startArrowSize
            item.endArrowSize = enmac.endArrowSize
            item.winStyle = enmac.win32Style

            item.dashPattern = ([int(v) for v in enmac.dashPattern.split(',')]
                                if enmac.dashPattern else
                                None)

            items.append(item)

        enmacSession.close()

        return [(None, items)]
