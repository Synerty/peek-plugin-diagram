from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class DoSomethingTuple(Tuple):
    """ Do Something Tuple

    This tuple is publicly exposed and will be the result of the doSomething api call.
    """
    __tupleType__ = diagramTuplePrefix + 'DoSomethingTuple'

    #:  The result of the doSomething
    result = TupleField(defaultValue=dict)
