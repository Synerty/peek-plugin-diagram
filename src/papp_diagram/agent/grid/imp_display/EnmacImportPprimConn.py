import logging

from geoalchemy2.shape import from_shape
from shapely.geometry.linestring import LineString

from peek_agent.orm.Display import DispPolylineConn, DispPolyline

logger = logging.getLogger(__name__)

class EnmacImportPprimConn:
    '''
    area_number      0
    type             10 (Connection)
    colour           80
    style            2
    width            1
    layer            31
    level            11
    symbol_number    -1
    start_x          216120.000000
    start_y          152766.000000
    symbol_centre_x  0.000000
    symbol_centre_y  0.000000
    end_x                  216000.000000
    end_y                  152766.000000
    connection_id          D00011b49CONN
    component_id           D00060340COMP
    popup_menu             11kV 3ph Cable Subt
    start_hot_spot_id      D0003f36dHOT
    end_hot_spot_id
    cable_level            1
    cable_index            102
    feeder_colour           148
    conn_type                       0
    zone_type                       0
    segmentNo                       1

    ## Start decimal this segment is of the whole line. 0 = start of connection
    start_pu                        0.00

    ## Percentaget this segment is of the whole line. 1 = end of connection
    end_pu                          0.80

    '''

    def __init__(self):
        logger.debug("TODO CONNS NEED JOINING!!!")
        ''' conns need to be imported with the connId and then merged post import '''

        pass

    def parse(self, section):
        assert (section['type'] == '10 (Connection)')


        disp = DispPolyline()

        points = [(float(section['start_x']), float(section['start_y'])),
                  (float(section['end_x']), float(section['end_y']))]

        disp.geom = from_shape(LineString(points))

        disp.lineWidth = int(section['width'])
        disp.lineColorId = section['colour']
        disp.lineStyleId = section['style']
        disp.levelId = section['level']
        disp.layerId = section['layer']

        disp.props = {#'connId' : section['connection_id'],
                      'compId': section['component_id'],
                      'menu': section['popup_menu'],
                      # 'startHsId': section['start_hot_spot_id'],
                      # 'endHsId': section['start_hot_spot_id'],
                      }

        return [(disp, [])]
