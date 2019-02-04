from typing import List, Optional

from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import BranchDeltaBase, \
    addBranchDeltaType
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
from peek_plugin_diagram.tuples.branches.ImportBranchDeltaColorOverride import \
    ImportBranchDeltaColorOverride


@addBranchDeltaType(BranchDeltaBase.TYPE_COLOUR_OVERRIDE,
                    ImportBranchDeltaColorOverride.tupleName())
class BranchDeltaColorOverride(BranchDeltaBase):
    """Diagram Delta Color Override Class

    This delta applies an override colour to a set of display keys.

    """
    __DISP_KEYS_NUM = 1
    __LINE_COLOR_NUM = 2
    __FILL_COLOR_NUM = 3
    __COLOR_NUM = 4

    def __init__(self):
        BranchDeltaBase.__init__(self, BranchDeltaBase.TYPE_COLOUR_OVERRIDE)

    @classmethod
    def loadFromImportTuple(cls, importDeltaTuple,
                            lookupHashConverter: LookupHashConverter
                            ) -> "BranchDeltaColorOverride":
        def mapColor(colorHash: str) -> Optional[int]:
            return lookupHashConverter.getColourId(colorHash) if colorHash else None

        self = cls()
        self.packedJson__ = [
            self.deltaType,  # __DELTA_TYPE_NUM
            importDeltaTuple.dispKeys,  # __DISP_KEYS_NUM
            mapColor(importDeltaTuple.lineColorHash),  # __LINE_COLOR_NUM
            mapColor(importDeltaTuple.fillColorHash),  # __FILL_COLOR_NUM
            mapColor(importDeltaTuple.colorHash),  # __COLOR_NUM
        ]
        return self

    #: The Disp Keys to color
    @property
    def dispKeys(self) -> List[str]:
        return self._jsonData[self.__DISP_KEYS_NUM]

    #: The Line Color apples to shape lines
    @property
    def lineColor(self) -> str:
        return self._jsonData[self.__LINE_COLOR_NUM]

    #: The Fill Color applies to closed shapes
    @property
    def fillColor(self) -> str:
        return self._jsonData[self.__FILL_COLOR_NUM]

    #: This color applies to texts
    @property
    def color(self) -> str:
        return self._jsonData[self.__COLOR_NUM]
