from geoalchemy2.shape import from_shape
from shapely.geometry.point import Point

from peek_agent.orm.Display import DispText


class EnmacImportPprimText:
    '''
    area_number      0
    type             6 (Text)
    colour           1
    style            0
    width            0
    layer            5
    level            1
    symbol_number    -1
    start_x          216000.500000
    start_y          151300.500000
    symbol_centre_x  0.000000
    symbol_centre_y  0.000000
    string: (90, 89)
    length: 8
    rotation             0.000000
    rotate with symbol   0
    '''

    ''' # This is an unknown one that causes issues, there is no "string:"
    area_number      0
    type             13 (Text)
    colour           1
    style            6
    width            130
    layer            30
    level            99
    symbol_number    0
    start_x          94.925667
    start_y          79.959511
    symbol_centre_x  95.000000
    symbol_centre_y  80.000000
    Unknown type 13
    '''

    def __init__(self):
        pass

    def parse(self, section):
        dispText = DispText()

        dispText.text = section.get('string:')
        if dispText.text is None:
            return []

        if dispText.text:
            dispText.text = dispText.text.decode('ascii', 'ignore')
        else:
            dispText.text = ""

        # If python can format this, then we have format codes, else leave it null
        # PoF only has one attribute value, so there is at most one format code.
        try:
            dispText.text % 0
            dispText.textFormat = dispText.text

        except TypeError:
            # This occurs when there is not exactly one thing to format.
            dispText.textFormat = None

        except ValueError:
            # Thos occurs when there is a percent in the string that isn't a valid format
            # EG, %v
            dispText.textFormat = None

        dispText.rotation = float(section.get('rotation', 0))

        dispText.textStyleId = section['width']

        dispText.colorId = section['colour']
        dispText.levelId = section['level']
        dispText.layerId = section['layer']

        styleInt = int(section['style'])
        dispText.horizontalAlign = styleInt % 3 - 1
        dispText.verticalAlign = styleInt / 3 - 1

        point = (float(section['start_x']), float(section['start_y']))
        dispText.geom = from_shape(Point(point))

        # Empty text with no dynamic value is pointless
        if not dispText.text and section['dynamic.attr.analog_char'] == "'":
            return []

        # A rotation of 360 is 0
        dispText.rotation = dispText.rotation % 360

        if not dispText.text:
            return []

        return [(dispText, [])]
