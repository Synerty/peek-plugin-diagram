from typing import Optional, List

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class ImportDispGroupTuple(Tuple):
    """ Imported Display Group

    This tuple is used by other plugins to load TEXT objects into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportDispGroupTuple'

    ### BEGIN DISP COMMON FIELDS ###

    #: Selectable, Is is this item selectable?, the layer also needs selectable=true
    selectable: bool = TupleField()

    #: Data, Generic data, this is passed to the popup context in the UI.
    # peek_plugin_diagram doesn't care as long as it's json compatible or None
    # Json length Length = 400
    data: Optional[dict] = TupleField(None)

    #: The unique hash of this display object
    # This will be referenced by:
    # ImportDispGroupPrtTuple.targetDispGroupHash, and
    # Any disps in the group, disp.parentDispGroupHash
    importHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    #: The key of the ModelSet to import into
    modelSetKey: str = TupleField()

    #: The Key of the Coordinate Set to import into
    coordSetKey: str = TupleField()

    #: Related links to LiveDB values for this display item
    # NOT USED
    # TODO, Remove
    # liveDbDispLinks: List[ImportLiveDbDispLinkTuple] = TupleField()

    ### BEGIN FIELDS FOR THIS DISP ###

    #: A name for this dispGroup
    name: str = TupleField()

    # TODO, Add relative center point fields