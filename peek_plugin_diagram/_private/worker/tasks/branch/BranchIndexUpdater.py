from collections import defaultdict

import logging
import pytz
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.orm.exc import NoResultFound
from txcelery.defer import DeferrableTask
from typing import List, Set, Tuple, Dict
from vortex.Payload import Payload

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispTextStyle
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet, ModelSet
from peek_plugin_diagram._private.storage.branch.BranchIndex import \
    BranchIndex
from peek_plugin_diagram._private.storage.branch.BranchIndexCompilerQueue import \
    BranchIndexCompilerQueue
from peek_plugin_diagram._private.tuples.branch.BranchTuple import \
    BranchTuple
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.branch.BranchGridIndexUpdater import \
    removeBranchGridIndexes, _insertOrUpdateBranchGrids
from peek_plugin_diagram._private.worker.tasks.branch._BranchIndexCalcChunkKey import \
    makeChunkKeyForBranchIndex

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def updateBranches(self, modelSetId: int, branchEncodedPayload: bytes) -> None:
    """ Update Branch

    This method is called from the UI to update a single branch.
    It could be called from a server API as well.

    All the branches must be for the same model set.

    """
    # Decode BranchTuples payload
    updatedBranches: List[BranchTuple] = (
        Payload().fromEncodedPayload(branchEncodedPayload).tuples
    )

    startTime = datetime.now(pytz.utc)

    queueTable = BranchIndexCompilerQueue.__table__

    branchesByCoordSetId: Dict[int, List[BranchTuple]] = defaultdict(list)
    chunkKeys: Set[str] = set()

    newBranchesToInsert = []

    # Create a lookup of CoordSets by ID
    dbSession = CeleryDbConn.getDbSession()
    try:
        # Get the latest lookups
        modelSet = dbSession.query(ModelSet).filter(ModelSet.id == modelSetId).one()
        coordSetById = {i.id: i for i in dbSession.query(ModelCoordSet).all()}
        textStylesById = {i.id: i for i in dbSession.query(DispTextStyle).all()}
        dbSession.expunge_all()

        # Update the branches
        # This will be a performance problem if lots of branches are updated,
        # however, on first writing this will just be used by the UI for updating
        # individual branches.
        for branch in updatedBranches:
            try:
                branchIndex = dbSession.query(BranchIndex) \
                    .filter(BranchIndex.id == branch.id) \
                    .one()
                branchIndex.packedJson = branch.packJson()

            except NoResultFound:
                newBranchesToInsert.append(branch)

            branchesByCoordSetId[branch.coordSetId].append(branch)

            chunkKeys.add(makeChunkKeyForBranchIndex(modelSet.key, branch.key))

        dbSession.commit()

    except Exception as e:
        dbSession.rollback()
        logger.debug("Retrying updateBranch, %s", e)
        logger.exception(e)
        raise self.retry(exc=e, countdown=3)

    finally:
        dbSession.close()

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        _insertOrUpdateBranches(conn, modelSet.key, modelSet.id, newBranchesToInsert)

        # Recompile the BranchGridIndexes
        for coordSetId, branches in branchesByCoordSetId.items():
            coordSet = coordSetById[coordSetId]
            assert coordSet.modelSetId == modelSetId, "Branches not all from one model"

            _insertOrUpdateBranchGrids(conn, coordSet, textStylesById, branches)

        # 3) Queue chunks for recompile
        conn.execute(
            queueTable.insert(),
            [dict(modelSetId=modelSetId, chunkKey=c) for c in chunkKeys]
        )

        transaction.commit()
        logger.debug("Updated %s BranchIndexes queued %s chunks in %s",
                     len(updatedBranches), len(chunkKeys),
                     (datetime.now(pytz.utc) - startTime))


    except Exception as e:
        transaction.rollback()
        logger.debug("Retrying updateBranch, %s", e)
        logger.exception(e)
        raise self.retry(exc=e, countdown=3)

    finally:
        conn.close()


@DeferrableTask
@celeryApp.task(bind=True)
def removeBranches(self, modelSetKey: str, coordSetKey: str, keys: List[str]) -> None:
    """ Remove Branches

    This worker task removes branches from the indexes.

    """

    startTime = datetime.now(pytz.utc)

    branchIndexTable = BranchIndex.__table__
    queueTable = BranchIndexCompilerQueue.__table__

    # Create a lookup of CoordSets by ID
    dbSession = CeleryDbConn.getDbSession()
    try:
        coordSet = dbSession.query(ModelCoordSet) \
            .filter(ModelCoordSet.modelSet.key == modelSetKey) \
            .filter(ModelCoordSet.key == coordSetKey) \
            .one()

        dbSession.expunge_all()

    finally:
        dbSession.close()

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        items = conn.execute(select(
            distinct=True,
            columns=[branchIndexTable.c.id, branchIndexTable.c.chunkKey],
            whereclause=and_(branchIndexTable.c.key.in_(keys),
                             branchIndexTable.c.coordSetId == coordSet.id)
        )).fetchall()

        branchIndexIds = [i.id for i in items]
        chunkKeys = set([i.chunkKey for i in items])

        removeBranchGridIndexes(conn, branchIndexIds)

        # 1) Delete existing branches
        conn.execute(
            branchIndexTable.delete(branchIndexTable.c.id.in_(branchIndexIds))
        )

        # 3) Queue chunks for recompile
        conn.execute(
            queueTable.insert(),
            [dict(modelSetId=coordSet.modelSetId, chunkKey=c) for c in chunkKeys]
        )

        transaction.commit()
        logger.debug("Deleted %s BranchIndexes queued %s chunks in %s",
                     len(branchIndexIds), len(chunkKeys),
                     (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        transaction.rollback()
        logger.debug("Retrying createOrUpdateBranches, %s", e)
        logger.exception(e)
        raise self.retry(exc=e, countdown=3)

    finally:
        conn.close()


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
        # Make note of the IDs being deleted
        branchIndexIdsBeingDeleted = [
            item.id for item in
            conn.execute(select(
                distinct=True,
                columns=[branchIndexTable.c.id],
                whereclause=branchIndexTable.c.importGroupHash.in_(importHashSet)
            ))
        ]

        removeBranchGridIndexes(conn, branchIndexIdsBeingDeleted)

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
