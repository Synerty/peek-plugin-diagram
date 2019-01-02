import json
from typing import List, Any
from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import \
    BranchDeltaBase, BRANCH_DELTA_CLASSES_BY_TYPE
from peek_plugin_diagram.tuples.branches.ImportBranchTuple import ImportBranchTuple


@addTupleType
class DiagramBranchTuple(Tuple):
    """ Imported Branch

    This tuple is used by other plugins to load branches into the diagram.

    """
    __COORD_SET_NUM = 0
    __KEY_NUM = 1
    __VISIBLE_NUM = 2

    __tupleType__ = diagramTuplePrefix + 'DiagramBranchTuple'

    #:  The Coordinate Set key that this branch applies to
    coordSetKey: str = TupleField()
    coordSetId: int = TupleField()

    #:  The unique key for this branch
    key: str = TupleField()

    #:  The packed JSON data for this object
    _packedJson:List[Any] = TupleField([])

    #:  Is this branch Visible by default
    visible: bool = TupleField()


    @classmethod
    def packJson(cls, importBranchTuple: ImportBranchTuple, coordSetId: int) -> str:
        """ Pack JSON

        This is used by the import worker to pack this object into the index.

        """

        deltasJson = [
            BranchDeltaBase
        ]
        packedJsonDict = [
            coordSetId,
            deltasJson,
            importBranchTuple.visible
        ]

        return json.dumps(packedJsonDict)

    @@property
    def coordSetId(self):
        return self._packedJson[0]

    @property
    def deltas(self)-> List[BranchDeltaBase]:
        branchDeltasJson = self._packedJson[self.__COORD_SET_ID]
        branchDeltaClasses = []
        for deltaJson in branchDeltasJson:
            branchType = deltaJson[0]
            Delta = BRANCH_DELTA_CLASSES_BY_TYPE[branchType]
            branchDeltaClasses.append(Delta.unpackJson(deltaJson))

        return branchDeltaClasses

    @@property
    def visible(self) -> bool:
        return self._packedJson[self.__VISIBLE_NUM]