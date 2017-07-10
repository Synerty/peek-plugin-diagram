from geoalchemy2.shape import from_shape
from shapely.geometry.point import Point

from peek_agent.orm.Display import DispEllipse


class EnmacImportPprimEllipse:
    '''
    area_number      0
    type             2 (Circle)
    colour           13
    style            0
    width            1
    layer            23
    level            34
    symbol_number    1811
    start_x          216975.000000
    start_y          152286.000000
    symbol_centre_x  216975.000000
    symbol_centre_y  152286.000000
    circle.llx            216968.500000
    circle.lly            152279.500000
    circle.urx            216981.500000
    circle.ury            152292.500000
    circle.start_angle    0
    circle.end_angle      360
    circle.filled         FALSE


    '''

    def __init__(self):
        pass

    def parse(self, section):
        assert (section['type'] == '2 (Circle)')

        centerX = float(section['start_x'])
        centerY = float(section['start_y'])
        point = (centerX, centerY)

        disp = DispEllipse()
        disp.levelId = section['level']
        disp.layerId = section['layer']
        disp.lineStyleId = section['style']
        disp.lineWidth = int(section['width'])

        disp.geom = from_shape(Point(point))

        if section['circle.filled'] == 'FALSE':
            disp.lineColorId = section['colour']
        else:
            disp.fillColorId = section['colour']

        disp.xRadius = centerX - float(section['circle.llx'])
        disp.yRadius = centerY - float(section['circle.lly'])

        # NOT, Enmac hac 0 degrees = y=0, x= positive axis (middle right)
        # It then draws counter clockwise.
        # PEEK draws clockwise from there, therefor we minis the end angle to make it negative
        disp.startAngle = int(section['circle.start_angle']) * -1
        disp.endAngle = disp.startAngle  + (int(section['circle.end_angle']) * -1)

        return [(disp, [])]
