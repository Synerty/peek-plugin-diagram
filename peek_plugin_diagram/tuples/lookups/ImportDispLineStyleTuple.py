from typing import Optional

from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix


@addTupleType
class ImportDispLineStyleTuple(Tuple):
    """ Import Display Line Style Tuple


    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispLineStyleTuple'



    name: str = TupleField()

    #: Fill the dash space, or let the what ever is underneath show.
    backgroundFillDashSpace: bool = TupleField()

    CAP_BUTT = "butt"
    CAP_ROUND = "round"
    CAP_SQUARE = "square"
    capStyle: str = TupleField()

    JOIN_BEVEL = "bevel"
    JOIN_ROUND = "round"
    JOIN_MITER = "miter"
    joinStyle: str = TupleField()

    startArrowSize: float = TupleField()
    endArrowSize: float = TupleField()

    winStyle: str = TupleField()

    dashPattern: Optional[str] = TupleField()

    importHash: str = TupleField()

    modelSetKey: str = TupleField()
