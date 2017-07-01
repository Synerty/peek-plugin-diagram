from vortex.Tuple import addTupleType, TupleField
from vortex.TupleAction import TupleActionABC

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix


@addTupleType
class AddIntValueActionTuple(TupleActionABC):
    __tupleType__ = diagramTuplePrefix + "AddIntValueActionTuple"

    stringIntId = TupleField()
    offset = TupleField()
