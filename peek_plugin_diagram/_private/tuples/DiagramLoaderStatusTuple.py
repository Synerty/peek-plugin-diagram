from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class DiagramLoaderStatusTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "DiagramLoaderStatusTuple"

    displayCompilerQueueStatus: bool = TupleField(False)
    displayCompilerQueueSize: int = TupleField(0)
    displayCompilerProcessedTotal: int = TupleField(0)
    displayCompilerLastError: str = TupleField()

    gridCompilerQueueStatus: bool = TupleField(False)
    gridCompilerQueueSize: int = TupleField(0)
    gridCompilerQueueProcessedTotal: int = TupleField(0)
    gridCompilerQueueLastError: str = TupleField()
