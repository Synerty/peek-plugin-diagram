from typing import Optional, List

from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix

PointsT = List[(float, float)]

@addTupleType
class ImportDispEllipseTuple(Tuple):
    """ Imported Display Ellipse

    This tuple is used by other plugins to load colours into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispEllipseTuple'

    #:  The name of the color
    name: str = TupleField()

    levelHash: str = TupleField()
    layerHash: str = TupleField()
    lineStyleHash: str = TupleField()

    lineWidth: int = TupleField()

    #:  The alt color
    geom: PointsT = TupleField()

    lineColorHash: Optional[str] = TupleField()
    fillColorHash: Optional[str] = TupleField()

    xRadius: float = TupleField()
    yRadius: float = TupleField()

    startAngle: int = TupleField()
    endAngle: int = TupleField()

    modelSetName: str = TupleField()

    #:  The import hash for this colour
    importHash: str = TupleField()
