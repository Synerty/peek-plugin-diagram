from twisted.internet.threads import deferToThread

from peek.core.orm import getNovaOrmSession
from peek.core.orm.Display import DispGroup
from peek.core.orm.EnmacCustom import EnmacCustomDressingMap
from peek_agent_pof.imp_display import NO_SYMBOL
from peek_agent_pof.imp_display import getEnmacSession, ActionAppearances, \
    ComponentClassDefn


class EnmacImportDressingMap:

    def import_(self):
        return deferToThread(self._blockingSession)

    def _blockingSession(self):
        enmacSession = getEnmacSession()

        self._items = {}

        session = getNovaOrmSession()

        enmacQry = (enmacSession.query(ActionAppearances)
                    .join(ComponentClassDefn,
                          ComponentClassDefn.appearance == ActionAppearances.name))

        groupIdsByName = {o.name: o.id for o in session.query(DispGroup)}

        noSymbol = groupIdsByName[NO_SYMBOL]


        # There is currently no need for an incemental import

        session.query(EnmacCustomDressingMap).delete()

        for app in enmacQry:
            map = EnmacCustomDressingMap()
            map.name = app.name
            map.compState = app.state
            map.dispGroupId = groupIdsByName.get(app.symbol, noSymbol)
            session.add(map)

        session.commit()
        session.close()

        enmacSession.commit()
        enmacSession.close()
