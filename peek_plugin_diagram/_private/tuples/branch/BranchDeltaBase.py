from abc import ABCMeta, abstractmethod
from typing import List, Any

from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter

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


class BranchDeltaBase(metaclass=ABCMeta):
    """ Branch Delta Base

    This is the base class of all diagram deltas.

    """
    __DELTA_TYPE_NUM = 0

    TYPE_COLOUR_OVERRIDE = 1
    TYPE_CREATE_DISP = 2

    deltaType: int = None

    _jsonData: List[Any] = []

    def __init__(self, deltaType: int):
        self.deltaType = deltaType

    @property
    @abstractmethod
    def dispKeys(self) -> List[str]:
        """ Disp Keys

        This property returns a list of disp keys that are referenced by the deltas
        in this branch.

        """

    @classmethod
    @abstractmethod
    def unpackJson(cls, deltaJson: List[Any]):
        pass

    @classmethod
    def loadFromImportTuple(cls, importDeltaTuple,
                            lookupHashConverter: LookupHashConverter) -> "BranchDeltaBase":
        Delta = _BRANCH_DELTA_CLASSES_BY_IMPORT_TUPLE_TYPE[importDeltaTuple.tupleType()]
        return Delta.loadFromImportTuple(importDeltaTuple=importDeltaTuple,
                                         lookupHashConverter=lookupHashConverter)

    @classmethod
    def createFromDeltaJson(cls, deltaJson: List[Any]) -> "BranchDeltaBase":
        deltaType = deltaJson[cls.__DELTA_TYPE_NUM]
        Delta = BRANCH_DELTA_CLASSES_BY_TYPE[deltaType]
        return Delta.unpackJson(deltaJson)
