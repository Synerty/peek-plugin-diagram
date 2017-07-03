from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix


@addTupleType
class ImportLiveDbDispLinkTuple(Tuple):
    """ Imported LiveDB Display Link

    A LiveDB value is a value that changes based on telemetry or other updates.
    This in turn drives an update to an attribute to a primitive display object.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportLiveDbDispLinkTuple'

    #:  The attribute name of the display object that this live db key updates
    dispAttrName: str = TupleField()

    #:  The key is the name of the value in the source system.
    liveDbKey: str = TupleField()

    #: The unique hash of this livedb object
    # importKeyHash: str = TupleField()

    #: The unique hash of the display object this link relates to
    importDispHash: str = TupleField()

    #: The unique hash for all the display items imported in a group with this one.
    #: for example, a page or tile reference.
    importGroupHash: str = TupleField()

    modelSetName: str = TupleField()
    coordSetName: str = TupleField()

    #:  Additional data for this object
    props: dict = TupleField()
