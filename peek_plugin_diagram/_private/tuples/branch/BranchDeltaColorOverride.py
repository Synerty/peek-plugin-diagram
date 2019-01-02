from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import BranchDeltaBase
from typing import List

class BranchDeltaColorOverride(BranchDeltaBase):
    """Diagram Delta Color Override Class

    This delta applies an override colour to a set of display keys.

    """
    __DISP_KEYS_NUM = 1
    __LINE_COLOR_NUM = 2
    __FILL_COLOR_NUM = 3
    __COLOR_NUM = 4

    #: The Disp Keys to color
    @property
    def dispKeys(self) -> List[str]:
        return self._jsonData[self.__DISP_KEYS_NUM]

    #: The Line Color apples to shape lines
    @property
    def lineColor(self)-> str:
        return self._jsonData[self.__LINE_COLOR_NUM]

    #: The Fill Color applies to closed shapes
    @property
    def fillColor(self)-> str:
        return self._jsonData[self.__FILL_COLOR_NUM]

    #: This color applies to texts
    @property
    def color(self)-> str:
        return self._jsonData[self.__COLOR_NUM]
