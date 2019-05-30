from datetime import datetime
from typing import List, Any, Optional

import pytz
import ujson
import ujson as json
from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
from peek_plugin_diagram.tuples.branches.ImportBranchTuple import ImportBranchTuple
from vortex import SerialiseUtil
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class BranchTuple(Tuple):
    """ Branch Tuple

    This is the private branch tuple used to work with the branch.

    """
    __ID_NUM = 0
    __COORD_SET_ID_NUM = 1
    __KEY_NUM = 2
    __VISIBLE_NUM = 3
    __UPDATED_DATE = 4
    __CREATED_DATE = 5
    __DISPS_NUM = 6
    __ANCHOR_DISP_KEYS_NUM = 7
    __UPDATED_BY_USER_NUM = 8
    __LAST_INDEX_NUM = 8

    __tupleType__ = diagramTuplePrefix + 'BranchTuple'

    __rawJonableFields__ = ["packedJson__"]

    #:  The packed JSON data for this object
    packedJson__: List[Any] = TupleField([])

    # This field is server side only
    importHash: str = TupleField()
    importGroupHash: str = TupleField()

    def __init__(self, **kwargs):
        Tuple.__init__(self, **kwargs)
        self.packedJson__ = [None] * (BranchTuple.__LAST_INDEX_NUM + 1)

    @classmethod
    def loadFromImportTuple(cls, importBranchTuple: ImportBranchTuple,
                            coordSetId: int,
                            lookupHashConverter: LookupHashConverter) -> "BranchTuple":
        """ Load From Import Tuple

        This is used by the import worker to pack this object into the index.

        """
        raise NotImplementedError("BranchTuple.loadFromImportTuple")
        # deltasJson = []
        # for importDelta in importBranchTuple.deltas:
        #     delta = BranchDeltaBase.loadFromImportTuple(
        #         importDeltaTuple=importDelta,
        #         lookupHashConverter=lookupHashConverter
        #     )
        #     deltasJson.append(delta._jsonData)

        self = cls()
        self.packedJson__ = [
            None,  # __ID_NUM
            coordSetId,  # __COORD_SET_NUM
            importBranchTuple.key,  # __KEY_NUM
            importBranchTuple.visible,  # __VISIBLE_NUM
            SerialiseUtil.toStr(datetime.now(pytz.utc)),  # __UPDATED_DATE
            SerialiseUtil.toStr(datetime.now(pytz.utc)),  # __CREATED_DATE
            None,  # __DELTAS_JSON_NUM
            importBranchTuple.updatedDisps,  # __UPDATED_DISPS_JSON_NUM
            importBranchTuple.addedDisps,  # __NEW_DISPS_JSON_NUM
            importBranchTuple.deletedDispKeys,  # __DELETED_DISP_IDS_NUM
        ]
        self.importHash = importBranchTuple.importHash
        self.importGroupHash = importBranchTuple.importGroupHash
        return self

    def packJson(self) -> str:
        return json.dumps(self.packedJson__)

    @classmethod
    def loadFromJson(self, packedJsonStr: str,
                     importHash: str, importGroupHash: str) -> 'BranchTuple':
        branchTuple = BranchTuple()
        branchTuple.packedJson__ = ujson.loads(packedJsonStr)
        branchTuple.importHash = importHash
        branchTuple.importGroupHash = importGroupHash

        while len(branchTuple.packedJson__) < BranchTuple.__LAST_INDEX_NUM + 1:
            branchTuple.packedJson__.append(None)

        return branchTuple

    @property
    def id(self):
        return self.packedJson__[self.__ID_NUM]

    @id.setter
    def id(self, value: Optional[int]):
        self.packedJson__[self.__ID_NUM] = value

    @id.setter
    def setId(self, id_: int):
        self.packedJson__[self.__ID_NUM] = id_

    @property
    def coordSetId(self):
        return self.packedJson__[self.__COORD_SET_ID_NUM]

    @property
    def key(self):
        return self.packedJson__[self.__KEY_NUM]

    @property
    def updatedByUser(self) -> str:
        return self.packedJson__[self.__UPDATED_BY_USER_NUM]

    @updatedByUser.setter
    def updatedByUser(self, val: str) -> None:
        self.packedJson__[self.__UPDATED_BY_USER_NUM] = val

    @property
    def disps(self) -> List:
        val = self.packedJson__[self.__DISPS_NUM][:]
        return val if val else []

    @disps.setter
    def disps(self, disps: List) -> None:
        self.packedJson__[self.__DISPS_NUM] = disps

    @property
    def anchorDispKeys(self) -> List[str]:
        val = self.packedJson__[self.__ANCHOR_DISP_KEYS_NUM][:]
        return val if val else []

    @property
    def visible(self) -> bool:
        return self.packedJson__[self.__VISIBLE_NUM]

    @property
    def updatedDate(self):
        if self.packedJson__[self.__UPDATED_DATE] is None:
            return None
        return SerialiseUtil.fromStr(self.packedJson__[self.__UPDATED_DATE],
                                     SerialiseUtil.T_DATETIME)

    @property
    def createdDate(self):
        return SerialiseUtil.fromStr(self.packedJson__[self.__CREATED_DATE],
                                     SerialiseUtil.T_DATETIME)
