from datetime import datetime

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class LocationIndexTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "LocationIndexTuple"

    modelSetKey: str = TupleField()
    indexBucket: str = TupleField()

    # The compressed (deflated) json string.
    blobData: str = TupleField()
    lastUpdate: datetime = TupleField()
