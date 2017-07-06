from typing import Optional, List

from geoalchemy2 import WKBElement

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class ImportDispConnectionTuple(Tuple):
    """ Imported Display Connection

    This tuple is used by other plugins to load connectors into the diagram.
    Connectors inherit Polylines.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispConnectionTuple'

    levelHash: str = TupleField()
    layerHash: str = TupleField()

    lineWidth: int = TupleField()
    lineStyleHash: str = TupleField()
    lineColorHash: Optional[str] = TupleField()

    geom: WKBElement = TupleField()

    #: The unique hash of this display object
    importHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    modelSetName: str = TupleField()
    coordSetName: str = TupleField()

    #:  Additional data for this object
    props: dict = TupleField()

    liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField()
