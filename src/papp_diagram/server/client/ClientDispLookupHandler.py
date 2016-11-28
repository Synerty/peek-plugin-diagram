from peek.core.orm import getNovaOrmSession
from peek.core.orm.Display import DispLevel, DispLayer, DispColor, DispTextStyle, \
    DispLineStyle

from txhttputil import SendAllModelHandler

###############################################################################


dispLayerFilt = {'key': "c.s.p.model.disp.layer"}
__dispLayerHandler = SendAllModelHandler(dispLayerFilt, DispLayer, getNovaOrmSession)

###############################################################################

dispLevelFilt = {'key': "c.s.p.model.disp.level"}
__dispLevelHandler = SendAllModelHandler(dispLevelFilt, DispLevel, getNovaOrmSession)

###############################################################################

dispColorFilt = {'key': "c.s.p.model.disp.color"}
__dispColorHandler = SendAllModelHandler(dispColorFilt, DispColor, getNovaOrmSession)

###############################################################################

dispTextStyleFilt = {'key': "c.s.p.model.disp.text_style"}
__dispTextStyleHandler = SendAllModelHandler(dispTextStyleFilt,
                                             DispTextStyle,
                                             getNovaOrmSession)

###############################################################################

dispLineStyleFilt = {'key': "c.s.p.model.disp.line_style"}
__dispLineStyleHandler = SendAllModelHandler(dispLineStyleFilt,
                                             DispLineStyle,
                                             getNovaOrmSession)
