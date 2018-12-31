import logging
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Set, Tuple

import pytz
from peek_plugin_base.worker import CeleryDbConn
from sqlalchemy import select, bindparam, and_
from txcelery.defer import DeferrableTask
from vortex.Payload import Payload

from peek_plugin_diagram._private.storage.ModelSet import \
    ModelSet
from peek_plugin_diagram._private.storage.branch.BranchIndex import \
    BranchIndex
from peek_plugin_diagram._private.storage.branch.BranchIndexCompilerQueue import \
    BranchIndexCompilerQueue
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.branch._BranchIndexCalcChunkKey import \
    makeChunkKey
from peek_plugin_diagram.tuples.branches.ImportBranchTuple import ImportBranchTuple

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def updateBranch(self, branchEncodedPayload: bytes) -> None:
    raise NotImplementedError("Updating branches is not enabled")


@DeferrableTask
@celeryApp.task(bind=True)
def createOrUpdateBranchs(self, branchesEncodedPayload: bytes) -> None:
    # Decode arguments
    newBranchs: List[ImportBranchTuple] = (
        Payload().fromEncodedPayload(branchesEncodedPayload).tuples
    )

    _validateNewBranchIndexs(newBranchs)

    modelSetIdByKey = _loadModelSets()

    # Do the import
    try:

        branchIndexByModelKey = defaultdict(list)
        for branchIndex in newBranchs:
            branchIndexByModelKey[branchIndex.modelSetKey].append(branchIndex)

        for modelSetKey, branchIndexs in branchIndexByModelKey.items():
            modelSetId = modelSetIdByKey.get(modelSetKey)
            if modelSetId is None:
                modelSetId = _makeModelSet(modelSetKey)
                modelSetIdByKey[modelSetKey] = modelSetId

            _insertOrUpdateObjects(branchIndexs, modelSetId)

    except Exception as e:
        logger.debug("Retrying import index-blueprintobjects, %s", e)
        raise self.retry(exc=e, countdown=3)


def _validateNewBranchIndexs(newBranchs: List[ImportBranchTuple]) -> None:
    for branchIndex in newBranchs:
        if not branchIndex.key:
            raise Exception("key is empty for %s" % branchIndex)

        if not branchIndex.modelSetKey:
            raise Exception("modelSetKey is empty for %s" % branchIndex)

        # if not branchIndex.branchIndex:
        #     raise Exception("branchIndex is empty for %s" % branchIndex)


def _loadModelSets() -> Dict[str, int]:
    # Get the model set
    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    try:
        modelSetTable = ModelSet.__table__
        results = list(conn.execute(select(
            columns=[modelSetTable.c.id, modelSetTable.c.key]
        )))
        modelSetIdByKey = {o.key: o.id for o in results}
        del results

    finally:
        conn.close()
    return modelSetIdByKey


def _makeModelSet(modelSetKey: str) -> int:
    # Get the model set
    dbSession = CeleryDbConn.getDbSession()
    try:
        newItem = ModelSet(key=modelSetKey, name=modelSetKey)
        dbSession.add(newItem)
        dbSession.commit()
        return newItem.id

    finally:
        dbSession.close()


def _insertOrUpdateObjects(newBranchs: List[ImportBranchTuple],
                           coordSetId: int) -> None:
    """ Insert or Update Objects

    1) Find objects and update them
    2) Insert object if the are missing

    """

    branchIndexTable = BranchIndex.__table__
    queueTable = BranchIndexCompilerQueue.__table__

    startTime = datetime.now(pytz.utc)

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        importHashSet = set()
        dontDeleteObjectIds = []
        objectIdByKey: Dict[str, int] = {}

        objectKeys = [o.key for o in newBranchs]
        chunkKeysForQueue: Set[Tuple[int, str]] = set()

        # Query existing objects
        results = list(conn.execute(select(
            columns=[branchIndexTable.c.id, branchIndexTable.c.key,
                     branchIndexTable.c.chunkKey, branchIndexTable.c.packedJson],
            whereclause=and_(branchIndexTable.c.key.in_(objectKeys),
                             branchIndexTable.c.coordSetId == coordSetId)
        )))

        foundObjectByKey = {o.key: o for o in results}
        del results

        # Get the IDs that we need
        newIdGen = CeleryDbConn.prefetchDeclarativeIds(
            BranchIndex, len(newBranchs) - len(foundObjectByKey)
        )

        # Create state arrays
        inserts = []
        updates = []

        # Work out which objects have been updated or need inserting
        for importBranchIndex in newBranchs:
            importHashSet.add(importBranchIndex.importGroupHash)

            existingObject = foundObjectByKey.get(importBranchIndex.key)

            packedJson = importBranchIndex.packJson()

            # Work out if we need to update the object type
            if existingObject:
                updates.append(
                    dict(b_id=existingObject.id,
                         b_packedJson=packedJson)
                )
                dontDeleteObjectIds.append(existingObject.id)

            else:
                id_ = next(newIdGen)
                existingObject = BranchIndex(
                    id=id_,
                    coordSetId=coordSetId,
                    key=importBranchIndex.key,
                    importGroupHash=importBranchIndex.importGroupHash,
                    chunkKey=makeChunkKey(importBranchIndex.modelSetKey,
                                          importBranchIndex.key),
                    packedJson=packedJson
                )
                inserts.append(existingObject.tupleToSqlaBulkInsertDict())

            objectIdByKey[existingObject.key] = existingObject.id
            chunkKeysForQueue.add((coordSetId, existingObject.chunkKey))

        if importHashSet:
            conn.execute(
                branchIndexTable
                    .delete(and_(~branchIndexTable.c.id.in_(dontDeleteObjectIds),
                                 branchIndexTable.c.importGroupHash.in_(importHashSet)))
            )

        # Insert the BranchIndex Objects
        if inserts:
            conn.execute(branchIndexTable.insert(), inserts)

        if updates:
            stmt = (
                branchIndexTable.update()
                    .where(branchIndexTable.c.id == bindparam('b_id'))
                    .values(packedJson=bindparam('b_packedJson'))
            )
            conn.execute(stmt, updates)

        if chunkKeysForQueue:
            conn.execute(
                queueTable.insert(),
                [dict(modelSetId=m, chunkKey=c) for m, c in chunkKeysForQueue]
            )

        if inserts or updates or chunkKeysForQueue:
            transaction.commit()
        else:
            transaction.rollback()

        logger.debug("Inserted %s updated %s queued %s chunks in %s",
                     len(inserts), len(updates), len(chunkKeysForQueue),
                     (datetime.now(pytz.utc) - startTime))

    except Exception:
        transaction.rollback()
        raise

    finally:
        conn.close()
