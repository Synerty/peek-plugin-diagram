import logging

from peek_agent.orm.Display import DispPolygon, DispText, DispEllipse
from peek_agent.orm.LiveDb import LiveDbDispLink

logger = logging.getLogger(__name__)


class EnmacImportPprimDynamic:
    """
    ------------------------------------------
      dynamic.attr.colour_char        'D'
      dynamic.attr.colour_number      5309465
      dynamic.attr.colour_type         0
    ------------------------------------------
      dynamic.attr.style_char         '
      dynamic.attr.style_number       0
    ------------------------------------------
      dynamic.attr.width_char         '
      dynamic.attr.width_number       0
    ------------------------------------------
      dynamic.attr.analog_char        '
      dynamic.attr.analog_number      0
      dynamic.attr.analog_rowNum      0
      dynamic.attr.analog_colNum      0
    ------------------------------------------
      dynamic.attr.operation_char     '
      dynamic.attr.operation_number   0
    ------------------------------------------
      dynamic.attr.rdbms_char         '
      dynamic.attr.rdbms_number       0
      dynamic.attr.rdbms_type         0
    ------------------------------------------
      dynamic.attr.rtu_char           '
      dynamic.attr.rtu_number         0
    ------------------------------------------
      dynamic.attr.overlay_symbol_type 0
      dynamic.attr.spare_char_3       '
      dynamic.attr.spare_int_1        0
    """

    def __init__(self):
        pass

    def parse(self, section, disp):

        dispLinks = []
        type = section['type']

        self._parseColor(disp, section, dispLinks)
        self._parseLineStyle(disp, section, dispLinks)
        self._parseLineWidth(disp, section, dispLinks)

        if type == '6 (Text)':
            self._parseTextValue(disp, section, dispLinks)

        elif type == '9 (Polygon)':
            self._parseFillPercentValue(disp, section, dispLinks)

        return dispLinks

    def _getAttrId(self, section, prefix):
        server = section[prefix + '_char'].strip().strip("'")
        if not server:
            return None

        num = int(section[prefix + '_number'])
        rowNum = section.get(prefix + '_rowNum')
        colNum = section.get(prefix + '_colNum')


        if (prefix == "dynamic.attr.analog"):
            dataType = section.get('dynamic.attr.rdbms_type', "0")  # 0 = "Current Value"
        else:
            # dynamic.attr.colour_type
            dataType = section.get(prefix + '_type', "0")  # 0 = "Current Value"

        if rowNum in ('', '0', None):
            rowNum = '0'

        if colNum in ('', '0', None):
            colNum = '0'

        return (server + '{:08x}'.format(num)
                + 'ATTR|%s|%s|%s' % (rowNum, colNum, dataType))

    def _addDispLink(self, attrName, liveRef, dispLinks):
        dispLink = LiveDbDispLink()
        dispLink.liveDbKey = 'None'
        dispLink.importKeyHash = liveRef
        dispLink.dispAttrName = attrName
        dispLinks.append(dispLink)

    def _parseColor(self, disp, section, dispLinks):
        colorLiveRef = self._getAttrId(section, 'dynamic.attr.colour')

        if not colorLiveRef:
            return

        colorDispLinks = []

        # If we havn't filled out a colour, then there is no colour for this.
        # EG fillColor = Null, means it's not filled.

        # Polygon, Line, Polyline, Ellipse
        if getattr(disp, 'fillColorId', None) is not None:
            self._addDispLink('fillColorId', colorLiveRef, colorDispLinks)

        if getattr(disp, 'lineColorId', None) is not None:
            self._addDispLink('lineColorId', colorLiveRef, colorDispLinks)

        if getattr(disp, 'colorId', None) is not None:
            self._addDispLink('colorId', colorLiveRef, colorDispLinks)

        dispLinks.extend(colorDispLinks)

        if not colorDispLinks:
            logger.warning("Can't find attribute name for colorLiveRef\n%s",
                           colorLiveRef, disp.tupleType())

    def _parseLineStyle(self, disp, section, dispLinks):
        lineStyleLiveRef = self._getAttrId(section, 'dynamic.attr.style')

        if not lineStyleLiveRef:
            return

        if hasattr(disp, 'lineStyleId'):
            attrName = 'lineStyleId'
        else:
            logger.warning("Can't find attribute name for lineStyleLiveRef\n%s",
                           lineStyleLiveRef, disp.tupleType())
            return

        self._addDispLink(attrName, lineStyleLiveRef, dispLinks)

    def _parseLineWidth(self, disp, section, dispLinks):
        lineWidthLiveRef = self._getAttrId(section, 'dynamic.attr.width')

        if not lineWidthLiveRef:
            return

        if hasattr(disp, 'lineWidth'):
            attrName = 'lineWidth'
        else:
            logger.warning("Can't find attribute name for lineWidthLiveRef\n%s",
                           lineWidthLiveRef, disp.tupleType())
            return

        self._addDispLink(attrName, lineWidthLiveRef, dispLinks)

    def _parseTextValue(self, disp, section, dispLinks):
        assert section['type'] == '6 (Text)', "This was written for text, check this"

        # RDBMS Type 22 seems to be associated with text primitives for "Tag Value"
        ''' dynamic.attr.rdbms_type         22'''

        textValueLiveRef = self._getAttrId(section, 'dynamic.attr.analog')

        if not textValueLiveRef:
            return

        if hasattr(disp, 'text'):
            attrName = 'text'

        elif DispPolygon.isSameTupleType(disp):
            # Ignore it, this is set when "fill direction" is set
            return

        else:
            logger.warning(
                "Can't find attribute name for textValueLiveRef\n\t%s\n\t%s",
                textValueLiveRef, disp.tupleType())
            return

        self._addDispLink(attrName, textValueLiveRef, dispLinks)

    def _parseFillPercentValue(self, disp, section, dispLinks):
        assert section[
                   'type'] == '9 (Polygon)', "This was written for polygons, check this"

        dynamicFillLiveRef = self._getAttrId(section, 'dynamic.attr.analog')

        if not dynamicFillLiveRef:
            return

        attrRdbmsType = section['dynamic.attr.rdbms_type']

        # Polygon / Ellipse
        if hasattr(disp, 'fillPercent'):
            attrName = "fillPercent"
            disp.fillPercent = 100.0
            disp.fillDirection = {
                '16': DispPolygon.FILL_BOTTOM_TO_TOP,
                '17': DispPolygon.FILL_TOP_TO_BOTTOM,
                '18': DispPolygon.FILL_LEFT_TO_RIGHT,
                '19': DispPolygon.FILL_RIGHT_TO_LEFT
            }[attrRdbmsType]

        else:
            logger.warning("Can't find attribute name for colorLiveRef\n%s",
                           dynamicFillLiveRef, disp.tupleType())
            return

        self._addDispLink(attrName, dynamicFillLiveRef, dispLinks)
