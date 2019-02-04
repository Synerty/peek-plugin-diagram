import logging
from typing import Dict, List

from peek_plugin_diagram._private.storage.Display import DispTextStyle
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.branch.BranchDeltaBase import BranchDeltaBase
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple
from peek_plugin_diagram._private.worker.tasks._CalcGridForDisp import makeGridKeysForDisp

logger = logging.getLogger(__name__)


def makeGridKeysForBranch(coordSet: ModelCoordSet,
                          branch: BranchTuple,
                          textStyleById: Dict[int, DispTextStyle]) -> List[str]:
    gridKeys = set()
    for delta in branch.deltas:
        gridKeys.update(_makeGridKeysForDelta(coordSet, delta, textStyleById))

    return list(gridKeys)


def _makeGridKeysForDelta(coordSet: ModelCoordSet,
                          delta: BranchDeltaBase,
                          textStyleById: Dict[int, DispTextStyle]) -> List[str]:

    if delta.deltaType == BranchDeltaBase.TYPE_COLOUR_OVERRIDE:
        # This would involve finding out which grids each DISP Key is in.
        # running a query for this type of delta would be very slow
        # (unless it was done at the start, for all branches???
        logger.debug("Branch Deltas TYPE_COLOUR_OVERRIDE"
                     " does not support grid index compiling")
        return []

    #: TODO
    raise NotImplementedError("Branch Delta type %s"
                              " makeGridKeysForDelta is not implemented", delta.deltaType)

    # return makeGridKeysForDisp(coordSet, delta, geomJson??, textStyleById)
