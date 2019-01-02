from typing import List, Any, Dict
from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import \
    BranchDeltaBase, BRANCH_DELTA_CLASSES_BY_TYPE
from peek_plugin_diagram.tuples.branches.ImportBranchTuple import ImportBranchTuple


@addTupleType
class BranchTuple(Tuple):
    """ Branch Tuple

    This is the private branch tuple used to work with the branch.

    """
    __COORD_SET_ID_NUM = 0
    __KEY_NUM = 1
    __VISIBLE_NUM = 2
    __DELTAS_JSON_NUM = 3

    __tupleType__ = diagramTuplePrefix + 'BranchTuple'

    __rawJonableFields__ = ["_packedJson"]

    #:  The packed JSON data for this object
    _packedJson: List[Any] = TupleField([])

    @classmethod
    def loadFromImportTuple(cls, importBranchTuple: ImportBranchTuple,
                            coordSetId: int,
                            colorHashMap: Dict[int, str]) -> "BranchTuple":
        """ Load From Import Tuple

        This is used by the import worker to pack this object into the index.

        """

        deltasJson = []
        for importDelta in importBranchTuple.deltas:
            delta = BranchDeltaBase.loadFromImportTuple(importDeltaTuple=importDelta,
                                                            colorHashMap=colorHashMap)
            deltasJson.append(delta._jsonData)

        self = cls()
        self._packedJson = [
            coordSetId,  # __COORD_SET_NUM
            importBranchTuple.key,  # __KEY_NUM
            importBranchTuple.visible,  # __VISIBLE_NUM
            deltasJson,  # __DELTAS_JSON
        ]
        return self

    @property
    def coordSetId(self):
        return self._packedJson[self.__COORD_SET_ID_NUM]

    @property
    def key(self):
        return self._packedJson[self.__KEY_NUM]

    @property
    def deltas(self) -> List[BranchDeltaBase]:
        branchDeltasJson = self._packedJson[self.__DELTAS_JSON_NUM]
        branchDeltaClasses = []
        for deltaJson in branchDeltasJson:
            branchType = deltaJson[0]
            Delta = BRANCH_DELTA_CLASSES_BY_TYPE[branchType]
            branchDeltaClasses.append(Delta.unpackJson(deltaJson))

        return branchDeltaClasses

    @property
    def visible(self) -> bool:
        return self._packedJson[self.__VISIBLE_NUM]
