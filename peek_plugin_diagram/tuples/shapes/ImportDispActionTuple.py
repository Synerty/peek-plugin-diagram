from typing import Optional, List

from geoalchemy2 import WKBElement

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class ImportDispActionTuple(Tuple):
    """ Imported Display Action

    An action inherits a polygon. It's a clickable shape.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispActionTuple'
    
    levelHash: str = TupleField()
    layerHash: str = TupleField()

    lineWidth: int = TupleField()
    lineStyleHash: Optional[str] = TupleField()
    lineColorHash: Optional[str] = TupleField()
    fillColorHash: Optional[str] = TupleField()

    geom: WKBElement = TupleField()

    xRadius: float = TupleField()
    yRadius: float = TupleField()

    startAngle: int = TupleField()
    endAngle: int = TupleField()

    importHash: str = TupleField()
    modelSetName: str = TupleField()
    coordSetName: str = TupleField()

    #:  Additional data for this object
    props: dict = TupleField()

    liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField([])
