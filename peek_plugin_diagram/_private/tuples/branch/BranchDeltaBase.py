

BRANCH_DELTA_CLASSES_BY_TYPE = {}


def addBranchDeltaType(cls):
    if cls.deltaType in BRANCH_DELTA_CLASSES_BY_TYPE:
        raise Exception("Delta Type %s is already registered" % cls.deltaType)

    BRANCH_DELTA_CLASSES_BY_TYPE[cls.deltaType] = cls
    return cls


class BranchDeltaBase:
    """ Branch Delta Base

    This is the base class of all diagram deltas.

    """
    __DELTA_TYPE_NUM = 0

    TYPE_COLOUR_OVERRIDE = 1

    deltaType: int = None

    _jsonData: List[Any] = []

    def __init__(self, deltaType: int):
        self.type = deltaType

    @classmethod
    def packJson(cls, importDeltaTuple, colorHashMap):
        raise NotImplementedError("packJson is not implemented for %s" % cls.deltaType)

    @classmethod
    def unpackJson(cls, jsonData):
        raise NotImplementedError("packJson is not implemented for %s" % cls.deltaType)
