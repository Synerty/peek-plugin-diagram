import logging
from typing import Dict, List

from peek_plugin_diagram._private.storage.Display import DispTextStyle
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import BranchDeltaBase
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple

logger = logging.getLogger(__name__)


def makeGridKeysForBranch(coordSet: ModelCoordSet,
                          branch: BranchTuple,
                          textStyleById: Dict[int, DispTextStyle],
                          gridKeysByDispKey: Dict[str, List[str]]) -> List[str]:
    gridKeys = set()
    for delta in branch.deltas:
        gridKeys.update(_makeGridKeysForDelta(coordSet, delta, textStyleById))

        # Add in the grids of all the effected
        for dispKey in delta.dispKeys:
            gridKeys.update(gridKeysByDispKey.get(dispKey, []))

    return list(gridKeys)


def _makeGridKeysForDelta(coordSet: ModelCoordSet,
                          delta: BranchDeltaBase,
                          textStyleById: Dict[int, DispTextStyle]) -> List[str]:
    if delta.deltaType == BranchDeltaBase.TYPE_COLOUR_OVERRIDE:
        # Nothing more to do, the effected grids are all based on the disps
        return []

    #: TODO
    raise NotImplementedError("Branch Delta type %s"
                              " makeGridKeysForDelta is not implemented", delta.deltaType)

    # return makeGridKeysForDisp(coordSet, delta, geomJson??, textStyleById)
