from typing import Optional, List

from geoalchemy2 import WKBElement

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class ImportDispPolylineTuple(Tuple):
    """ Imported Display Polyline

    This tuple is used by other plugins to load Polyline into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispPolylineTuple'

    ### BEGIN DISP COMMON FIELDS ###

    #: Key, This value is a unique ID of the object that this graphic represents
    # It's used to link this graphical object to objects in other plugins, like vertices
    # in the peek-plugin-graphdb plugin.
    # Length = 50
    key :str = TupleField()

    #: Selectable, Is is this item selectable?, the layer also needs selectable=true
    selectable :bool = TupleField()

    #: The hash of the level to link to (Matches ImportDispLevel.importHash)
    levelHash: str = TupleField()

    #: The hash of the layer to link to (Matches ImportDispLayer.importHash)
    layerHash: str = TupleField()

    #: The unique hash of this display object
    importHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    #: The key of the ModelSet to import into
    modelSetKey: str = TupleField()

    #: The Key of the Coordinate Set to import into
    coordSetKey: str = TupleField()

    #: Related links to LiveDB values for this display item
    liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField()

    #: Parent DispGroup Hash, If this disp is part of a disp group then set this field to
    # the ImportDispGroupTuple.importHash fields value
    parentDispGroupHash: str = TupleField()

    ### BEGIN FIELDS FOR THIS DISP ###

    lineWidth: int = TupleField()
    lineStyleHash: str = TupleField()
    lineColorHash: Optional[str] = TupleField()

    geom: WKBElement = TupleField()
