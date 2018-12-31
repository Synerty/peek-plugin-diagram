import json
from typing import List

from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix


@addTupleType
class ImportBranchTuple(Tuple):
    """ Imported Branch

    This tuple is used by other plugins to load branches into the diagram.

    """
    __tupleType__ = diagramTuplePrefix + 'ImportBranchTuple'

    #:  The name of the model set for this branch
    modelSetKey: str = TupleField()

    #:  The Coordinate Set key that this branch applies to
    coordSetKey: str = TupleField()

    #:  The unique key for this branch
    key: str = TupleField()

    #:  The import hash for this branch
    importHash: str = TupleField()

    #:  The alt color
    delta: List = TupleField([])

    #:  Is this branch Visible by default
    visible: bool = TupleField()


    def packJson(self) -> str:
        """ Pack JSON

        This is used by the import worker to pack this object into the index.

        """
        packedJsonDict = dict(
            ck=self.coordSetKey,
            k=self.key,
            d=self.delta,
            v=self.visible
        )

        return json.dumps(packedJsonDict, sort_keys=True)
