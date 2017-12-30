from datetime import datetime

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.tuples.LocationIndexTuple import LocationIndexTuple
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class EncodedLocationIndexTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "EncodedLocationIndexTuple"

    modelSetKey: str = TupleField()
    indexBucket: str = TupleField()

    # The LocationIndexTuple pre-encoded to a Payload
    encodedLocationIndexTuple: bytes = TupleField()
    lastUpdate: str = TupleField()
