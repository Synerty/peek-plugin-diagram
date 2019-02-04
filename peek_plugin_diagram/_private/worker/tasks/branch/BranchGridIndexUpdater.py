from collections import defaultdict

import logging
import pytz
from datetime import datetime
from typing import List, Set, Tuple, Dict

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispTextStyle
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyCompilerQueue
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.storage.branch.BranchGridIndex import BranchGridIndex
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple
from peek_plugin_diagram._private.worker.tasks._CalcGridForBranch import \
    makeGridKeysForBranch

logger = logging.getLogger(__name__)

""" Branch Grid Index Updater

This module is called from the BranchGridIndexUpdater method.

1) Figure out which grid this branch effects.
1.1) Convert the branch deltas to a list of disps,
    from the disps they effect
    and the disps they create
1.2) Use the makeGridKeysForDisp method to work out the grid keys
2) Delete the old entries from the BranchGridIndex
3) Insert the new entries into the BranchGridIndex
4) Insert the grid keys into the GridKeyCompuler Queue
"""


def _insertOrUpdateBranchGrids(conn, coordSet: ModelCoordSet,
                               textStylesById: Dict[int, DispTextStyle],
                               newBranches: List[BranchTuple]) -> None:
    """ Compile Branch Grid Index Task

    :param conn: The connection used to exection SQL
    :param coordSet: The ID of the Coordinate Set.
    :type textStylesById: A lookup of the text syles, used to calculated text sizes.
    :param newBranches: The branch tuples to add to the grid
    :returns: A list of grid keys that have been updated.
    """

    startTime = datetime.now(pytz.utc)

    branchGridIndexTable = BranchGridIndex.__table__
    queueTable = GridKeyCompilerQueue.__table__

    chunkKeysForQueue: Set[Tuple[int, str]] = set()

    # GridKeyIndexes to insert
    gridKeyIndexesByBranchId = defaultdict(list)
    totalGridKeys = 0

    # BranchIndexIds to delete
    branchIndexIdsToDelete = []

    # Create state arrays
    inserts = []

    # Calculate the grid keys of each branch.
    for newBranch in newBranches:
        gridKeys = makeGridKeysForBranch(coordSet, newBranch, textStylesById)
        gridKeyIndexesByBranchId[newBranch.id] = gridKeys
        totalGridKeys += len(gridKeys)

        branchIndexIdsToDelete.append(newBranch.id)

    # Get the IDs that we need
    newIdGen = CeleryDbConn.prefetchDeclarativeIds(BranchGridIndex, totalGridKeys)

    # Create the inserts for each branch
    for newBranch in newBranches:

        for gridKey in gridKeyIndexesByBranchId[newBranch.id]:
            # noinspection PyTypeChecker
            id_ = next(newIdGen)
            insert = BranchGridIndex(
                id=id_,
                branchIndexId=newBranch.id,
                gridKey=gridKey
            )
            inserts.append(insert.tupleToSqlaBulkInsertDict())

            chunkKeysForQueue.add((coordSet.id, gridKey))

    # 2) Delete existing branches
    if branchIndexIdsToDelete:
        conn.execute(
            branchGridIndexTable.delete(branchGridIndexTable
                                        .c.branchIndexId.in_(branchIndexIdsToDelete))
        )

    # 3) Insert new branches
    if inserts:
        conn.execute(branchGridIndexTable.insert(), inserts)

    # 4) Queue chunks for recompile
    if chunkKeysForQueue:
        conn.execute(
            queueTable.insert(),
            [dict(coordSetId=cid, chunkKey=ck) for cid, ck in chunkKeysForQueue]
        )

    logger.debug("Inserted %s BrandIndexes queued %s chunks in %s",
                 len(inserts), len(chunkKeysForQueue),
                 (datetime.now(pytz.utc) - startTime))
