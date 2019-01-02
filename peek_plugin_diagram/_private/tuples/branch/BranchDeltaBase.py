from typing import List, Any, Dict

BRANCH_DELTA_CLASSES_BY_TYPE = {}
_BRANCH_DELTA_CLASSES_BY_IMPORT_TUPLE_TYPE = {}


def addBranchDeltaType(deltaType: int, importDeltaTupleType: str):
    def f(cls):
        if deltaType in BRANCH_DELTA_CLASSES_BY_TYPE:
            raise Exception("Delta Type %s is already registered" % cls.deltaType)

        if importDeltaTupleType in _BRANCH_DELTA_CLASSES_BY_IMPORT_TUPLE_TYPE:
            raise Exception("Delta Type %s is already registered" % cls.deltaType)

        BRANCH_DELTA_CLASSES_BY_TYPE[deltaType] = cls
        _BRANCH_DELTA_CLASSES_BY_IMPORT_TUPLE_TYPE[importDeltaTupleType] = cls
        return cls

    return f


class BranchDeltaBase:
    """ Branch Delta Base

    This is the base class of all diagram deltas.

    """
    __DELTA_TYPE_NUM = 0

    TYPE_COLOUR_OVERRIDE = 1

    deltaType: int = None

    _jsonData: List[Any] = []

    def __init__(self, deltaType: int):
        self.deltaType = deltaType

    @classmethod
    def loadFromImportTuple(cls, importDeltaTuple,
                            colorHashMap:Dict[int,str]) -> "BranchDeltaBase":
        Delta = _BRANCH_DELTA_CLASSES_BY_IMPORT_TUPLE_TYPE[importDeltaTuple.tupleType()]
        return Delta.loadFromImportTuple(importDeltaTuple=importDeltaTuple,
                                         colorHashMap=colorHashMap)
