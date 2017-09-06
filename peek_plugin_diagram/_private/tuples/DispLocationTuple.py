from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class DispKeyLocationTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "DispKeyLocationTuple"

    coordSetId: str = TupleField()
    dispId: str = TupleField()

    x: float = TupleField()
    y: float = TupleField()

    def toLocationJson(self):
        return '[%s,%s,%s,%s]' % (
            self.coordSetId,
            self.dispId,
            self.x,
            self.y
        )
