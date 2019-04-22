from typing import List, Optional

from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import BranchDeltaBase, \
    addBranchDeltaType
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
from peek_plugin_diagram.tuples.branches.ImportBranchDeltaCreateDisp import \
    ImportBranchDeltaCreateDisp


@addBranchDeltaType(BranchDeltaBase.TYPE_CREATE_DISP,
                    ImportBranchDeltaCreateDisp.tupleName())
class BranchDeltaCreateDisp(BranchDeltaBase):
    """Diagram Delta Color Override Class

    This delta applies an override colour to a set of display keys.

    """
    __DISPS_NUM = 1

    def __init__(self):
        BranchDeltaBase.__init__(self, BranchDeltaBase.TYPE_CREATE_DISP)

    @classmethod
    def loadFromImportTuple(cls, importDeltaTuple,
                            lookupHashConverter: LookupHashConverter
                            ) -> "BranchDeltaCreateDisp":
        def mapColor(colorHash: str) -> Optional[int]:
            return lookupHashConverter.getColourId(colorHash) if colorHash else None

        self = cls()
        self.packedJson__ = [
            self.deltaType,  # __DELTA_TYPE_NUM
            importDeltaTuple.disps,  # __DISP_KEYS_NUM
        ]
        return self

    #: The Disp Keys to color
    @property
    def disps(self) -> List[str]:
        return self._jsonData[self.__DISPS_NUM]