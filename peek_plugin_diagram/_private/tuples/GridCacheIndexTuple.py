from datetime import datetime
from typing import Dict

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class GridCacheIndexTuple(Tuple):
    __tupleType__ = diagramTuplePrefix + "GridCacheIndexTuple"

    data: Dict[str, str] = TupleField()