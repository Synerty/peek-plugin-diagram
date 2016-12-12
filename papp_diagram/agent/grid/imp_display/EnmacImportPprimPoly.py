from geoalchemy2.shape import from_shape
from shapely.geometry.linestring import LineString
from shapely.geometry.polygon import Polygon

from peek_agent.orm.Display import DispPolyline, DispPolygon


class EnmacImportPprimPoly:
    '''
    area_number      0
    type             9 (Polygon)
    colour           0
    style            0
    width            0
    layer            23
    level            34
    symbol_number    1820
    start_x          217216.000000
    start_y          152135.000000
    symbol_centre_x  217220.000000
    symbol_centre_y  152136.000000
    polyline.npoints      4
    polyline.x[0]        217216.000000
    polyline.y[0]        152135.000000
    polyline.x[1]        217216.000000
    polyline.y[1]        152136.000000
    polyline.x[2]        217224.000000
    polyline.y[2]        152136.000000
    polyline.x[3]        217224.000000
    polyline.y[3]        152135.000000


    ============================

    area_number      0
    type             8 (Polyline)
    colour           3
    style            1
    width            2
    layer            24
    level            35
    symbol_number    1904
    start_x          216136.500000
    start_y          152718.000000
    symbol_centre_x  216140.000000
    symbol_centre_y  152711.000000
    polyline.npoints      5
    polyline.x[0]        216136.500000
    polyline.y[0]        152718.000000
    polyline.x[1]        216143.500000
    polyline.y[1]        152718.000000
    polyline.x[2]        216143.500000
    polyline.y[2]        152702.500000
    polyline.x[3]        216136.500000
    polyline.y[3]        152702.500000
    polyline.x[4]        216136.500000
    polyline.y[4]        152718.000000

    ============================

    area_number      0
    type             4 (Line)
    colour           1
    style            0
    width            1
    layer            23
    level            14
    symbol_number    1242
    start_x          214624.000000
    start_y          149923.000000
    symbol_centre_x  214625.000000
    symbol_centre_y  149910.000000
    line.end_x            214624.000000
    line.end_y            149901.000000


    '''

    def __init__(self):
        pass

    def parse(self, section):
        type = section['type']
        isPolygon = type == '9 (Polygon)'

        def getPoints():
            points = []
            for i in range(0, int(section['polyline.npoints'])):
                points.append((float(section['polyline.x[%s]' % i]),
                               float(section['polyline.y[%s]' % i])))
            return points

        if type == '4 (Line)':
            disp = DispPolyline()
            points = [(float(section['start_x']), float(section['start_y'])),
                      (float(section['line.end_x']), float(section['line.end_y']))]
            disp.geom = from_shape(LineString(points))

        elif type == '8 (Polyline)':
            disp = DispPolyline()
            disp.geom = from_shape(LineString(getPoints()))

        else:
            assert isPolygon
            disp = DispPolygon()
            disp.geom = from_shape(Polygon(getPoints()))

        disp.lineWidth = int(section['width'])

        if isPolygon:
            disp.fillColorId = section['colour']

        disp.lineColorId = section['colour']
        disp.lineStyleId = section['style']
        disp.levelId = section['level']
        disp.layerId = section['layer']

        return [(disp, [])]
