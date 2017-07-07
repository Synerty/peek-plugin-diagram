from typing import Optional, List

from geoalchemy2 import WKBElement

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class ImportDispTextTuple(Tuple):
    """ Imported Display Text

    This tuple is used by other plugins to load TEXT objects into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispTextTuple'

    levelHash: str = TupleField()
    layerHash: str = TupleField()

    textStyleHash: str = TupleField()
    colorHash: Optional[str] = TupleField()

    H_ALLIGN_LEFT = -1
    H_ALLIGN_CENTER = 0
    H_ALLIGN_RIGHT = 1
    horizontalAlign: int = TupleField()

    V_ALLIGN_TOP = -1
    V_ALLIGN_CENTER = 0
    V_ALLIGN_BOTTOM = 1
    verticalAlign: int = TupleField()

    geom: WKBElement = TupleField()

    rotation: float = TupleField()

    #: The value of the text
    text: str = TupleField()

    #: This field stores text with format strings that are used to create the text above.
    textFormat: Optional[str] = TupleField()

    #: The unique hash of this display object
    importHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    modelSetName: str = TupleField()
    coordSetName: str = TupleField()

    liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField()
