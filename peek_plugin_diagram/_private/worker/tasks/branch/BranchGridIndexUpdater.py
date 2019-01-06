import logging
import pytz
from datetime import datetime
from typing import List, Set, Tuple

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.branch.BranchIndex import BranchIndex
from peek_plugin_diagram._private.storage.branch.BranchIndexCompilerQueue import \
    BranchIndexCompilerQueue
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple

logger = logging.getLogger(__name__)

""" Branch Grid Index Updater

This module is called from the BranchIndexUpdater method.

1) Figure out which grid this branch effects.
1.1) Convert the branch deltas to a list of disps,
    from the disps they effect
    and the disps they create
1.2) Use the makeGridKeys method to work out the grid keys
2) Delete the old entries from the BranchGridIndex
3) Insert the new entries into the BranchGridIndex
4) Insert the grid keys into the GridKeyCompuler Queue
"""


def _insertOrUpdateBranchGrids(conn, modelSetKey: str, coordSetId: int,
                               newBranches: List[BranchTuple]) -> None:
    """ Compile Branch Grid Index Task

    :param conn: The connection used to exection SQL
    :param modelSetKey: The Key of the Model Set.
    :param coordSetId: The ID of the Coordinate Set.
    :param newBranches: The branch tuples to add to the grid
    :returns: A list of grid keys that have been updated.
    """

    startTime = datetime.now(pytz.utc)

    branchIndexTable = BranchIndex.__table__
    queueTable = BranchIndexCompilerQueue.__table__

    importHashSet = set()

    chunkKeysForQueue: Set[Tuple[int, str]] = set()

    # Get the IDs that we need
    newIdGen = CeleryDbConn.prefetchDeclarativeIds(BranchIndex, len(newBranches))

    # Create state arrays
    inserts = []

    # Work out which objects have been updated or need inserting
    for newBranch in newBranches:
        importHashSet.add(newBranch.importGroupHash)
        branchJson = newBranch.packJson()

        id_ = next(newIdGen)
        existingObject = BranchIndex(
            id=id_,
            coordSetId=newBranch.coordSetId,
            key=newBranch.key,
            importGroupHash=newBranch.importGroupHash,
            chunkKey=makeChunkKeyForBranchIndex(modelSetKey, newBranch.key),
            packedJson=branchJson
        )
        inserts.append(existingObject.tupleToSqlaBulkInsertDict())

        chunkKeysForQueue.add((modelSetId, existingObject.chunkKey))

    # 1) Delete existing branches
    if importHashSet:
        conn.execute(
            branchIndexTable.delete(branchIndexTable.c.importGroupHash.in_(importHashSet))
        )

    # 2) Insert new branches
    if inserts:
        conn.execute(branchIndexTable.insert(), inserts)

    # 3) Queue chunks for recompile
    if chunkKeysForQueue:
        conn.execute(
            queueTable.insert(),
            [dict(modelSetId=m, chunkKey=c) for m, c in chunkKeysForQueue]
        )

    logger.debug("Inserted %s queued %s chunks in %s",
                 len(inserts), len(chunkKeysForQueue),
                 (datetime.now(pytz.utc) - startTime))
