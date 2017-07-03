from typing import Optional, List

from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.ImportTypes import GeomT
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple


@addTupleType
class ImportDispEllipseTuple(Tuple):
    """ Imported Display Ellipse

    This tuple is used by other plugins to load colours into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispEllipseTuple'

    levelHash: str = TupleField()
    layerHash: str = TupleField()

    lineWidth: int = TupleField()
    lineStyleHash: str = TupleField()
    lineColorHash: Optional[str] = TupleField()
    fillColorHash: Optional[str] = TupleField()

    geom: GeomT = TupleField()

    xRadius: float = TupleField()
    yRadius: float = TupleField()

    startAngle: int = TupleField()
    endAngle: int = TupleField()

    #: The unique hash of this display object
    importHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    modelSetName: str = TupleField()
    coordSetName: str = TupleField()

    liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField()
