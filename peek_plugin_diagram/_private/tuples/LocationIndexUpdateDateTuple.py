from typing import Dict

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class LocationIndexUpdateDateTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "LocationIndexUpdateDateTuple"

    modelSetKey: str = TupleField()
    indexBucketUpdateDates: Dict[str,str] = TupleField({})
