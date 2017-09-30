from typing import Dict

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple



#: This the type of the data that we get when the clients observe new locationIndexs.
DeviceLocationIndexT = Dict[str, str]

@addTupleType
class LocationIndexUpdateDateTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "LocationIndexUpdateDateTuple"

    modelSetKey: str = TupleField()
    indexBucketUpdateDates: DeviceLocationIndexT = TupleField({})
