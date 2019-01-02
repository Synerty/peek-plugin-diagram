from vortex.Tuple import addTupleType, TupleField
from vortex.TupleAction import TupleActionABC

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple


@addTupleType
class BranchUpdateTupleAction(TupleActionABC):
    """ Branch Update Action

    This is the Branch Update tuple Action

    """
    __tupleType__ = diagramTuplePrefix + 'BranchUpdateTupleAction'

    modelSetId: int = TupleField()
    branchTuple: BranchTuple = TupleField()
