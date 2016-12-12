import shapely
from shapely import affinity
from geoalchemy2.shape import from_shape
from shapely.geometry.point import Point
from shapely.geometry.polygon import Polygon

from peek_agent.orm.Display import DispAction, DispGroupPointer
from peek_agent.orm.LiveDb import LiveDbDispLink


class EnmacImportPprimHotspot:
    '''
area_number      0
type             3 (Hot Spot)
colour           1
style            0
width            0
layer            23
level            34
symbol_number    1840
start_x          216910.000000
start_y          152755.500000
symbol_centre_x  216910.000000
symbol_centre_y  152756.000000
hot_spot.llx             216905.250000
hot_spot.lly             152751.000000
hot_spot.urx             216914.750000
hot_spot.ury             152760.000000
hot_spot.hot_spot_action 1 (Popup Menu + Dressing)
hot_spot.hot_spot_id     D00054363HOT
hot_spot.component_id    D00060623COMP
hot_spot.hot_spot_text   'Switch Fuse (Earthable) - M'
hot_spot.flash_single    0
x_scale              1.000000
y_scale              1.000000
rotation             90.000000
flip_x               '0'
flip_y               '0'

    '''

    def __init__(self):
        pass

    def parse(self, section):
        assert (section['type'] == '3 (Hot Spot)')

        items = []

        disp = DispAction()
        disp.levelId = section['level']
        disp.layerId = section['layer']
        disp.lineColorId = section['colour']
        disp.lineStyleId = section['style']
        disp.lineWidth = int(section['width'])

        llx = float(section['hot_spot.llx'])
        lly = float(section['hot_spot.lly'])
        urx = float(section['hot_spot.urx'])
        ury = float(section['hot_spot.ury'])

        points = [(llx, lly), (llx, ury), (urx, ury), (urx, lly)]
        shape = Polygon(points)

        rotation = int(float(section['rotation']))
        if rotation:
            shape = affinity.rotate(shape, rotation)

        disp.geom = from_shape(shape)

        disp.data = {'action': section['hot_spot.hot_spot_action'],
                     'nodeRef': section['hot_spot.component_id'],
                     'data1': section['hot_spot.hot_spot_text'],
                     'flashOnce': section['hot_spot.flash_single'],
                     }
        items.append((disp, []))

        # NOT REQUIRED, the Overlays currently provide this support
        # if section['hot_spot.component_id']:
        #     dressingDisp = DispGroupPointer()
        #     dressingDisp.levelId = disp.levelId
        #     dressingDisp.layerId = disp.layerId
        #     dressingDisp.groupId = 'NO_SYMBOL'
        #     dressingDisp.rotation = rotation
        #     dressingDisp.geom = from_shape(Point(float(section['symbol_centre_x']),
        #                                          float(section['symbol_centre_y'])))
        #
        #     items.append((dressingDisp, []))
        #
        #     dressingDynamic = LiveDbDispLink()
        #     dressingDynamic.liveDbKey = 'None'
        #     dressingDynamic.importKeyHash = section['hot_spot.component_id']
        #     dressingDynamic.dispAttrName = 'groupId'
        #
        #     items.append((dressingDisp, [dressingDynamic]))

        return items
