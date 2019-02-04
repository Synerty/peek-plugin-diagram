import logging
import pytz
from datetime import datetime
from txcelery.defer import DeferrableTask
from typing import List, Set, Tuple

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.branch.BranchIndex import \
    BranchIndex
from peek_plugin_diagram._private.storage.branch.BranchIndexCompilerQueue import \
    BranchIndexCompilerQueue
from peek_plugin_diagram._private.tuples.branch.BranchTuple import \
    BranchTuple
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.branch._BranchIndexCalcChunkKey import \
    makeChunkKeyForBranchIndex

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def updateBranch(self, branchEncodedPayload: bytes) -> None:
    """ Update Branch

    This method is called from the UI to update a single branch.
    It could be called from a server API as well.

    """
    raise NotImplementedError("Updating branches is not implemented")


@DeferrableTask
@celeryApp.task(bind=True)
def removeBranches(self, modelSetKey: str, coordSetKey: str, keys: List[str]) -> None:
    """ Remove Branches

    This worker task removes branches from the indexes.

    """
    raise NotImplementedError("Removing branches is not implemented")


def _insertOrUpdateBranches(conn,
                            modelSetKey: str,
                            modelSetId: int,
                            newBranches: List[BranchTuple]) -> None:
    """ Insert or Update Branches

    1) Delete existing branches
    2) Insert new branches
    3) Queue chunks for recompile

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

        # noinspection PyTypeChecker
        newBranch.id = next(newIdGen)
        branchJson = newBranch.packJson()

        existingObject = BranchIndex(
            id=newBranch.id,
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
