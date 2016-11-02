from peek_agent.orm.Display import DispTextStyle
from EnmacImportLookup import EnmacImportLookup
from peek_agent_pof.imp_model import EnmacOrm
from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession


class EnmacImportDispTextStyle(EnmacImportLookup):
    LOOKUP_NAME=DispTextStyle.tupleType()

    def _loadTuplesBlocking(self):
        enmacSession = getEnmacSession()
        qry = (enmacSession
               .query(EnmacOrm.Fonts)
               .order_by(EnmacOrm.Fonts.id))

        items = []

        for enmac in qry:
            item = DispTextStyle()
            item.importHash = enmac.id
            item.name = enmac.description

            if enmac.win32Name is None:
                font, size, style = "GillSans", 10, None
            else:
                font, size = enmac.win32Name.split(',', 1)
                style = None

                if ',' in size:
                    size, style = size.split(',')

            font = font.strip()
            replace = {'Lucida Console': 'Courier New'}
            if font in replace:
                font = replace[font]

            item.fontName = font
            item.fontSize = size
            item.fontStyle = (None if not style else
                              {
                                  'b': 'bold',
                                  'u': None,  # Underline not supported,
                                  'm': None,  # Medium not supported
                              }[style.lower()])
            item.scalable = float(enmac.scalable) != 0
            item.scaleFactor = enmac.scaleFactor

            items.append(item)

        enmacSession.close()

        return [(None, items)]
