from vortex.Tuple import addTupleType, TupleField
from vortex.TupleAction import TupleActionABC

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix


@addTupleType
class StringCapToggleActionTuple(TupleActionABC):
    __tupleType__ = diagramTuplePrefix + "StringCapToggleActionTuple"

    stringIntId = TupleField()
