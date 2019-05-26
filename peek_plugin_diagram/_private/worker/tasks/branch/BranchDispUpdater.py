import logging
from datetime import datetime
from typing import List

import pytz
import ujson as json
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.server.controller.DispCompilerQueueController import \
    DispCompilerQueueController
from peek_plugin_diagram._private.storage.Display import DispBase
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyCompilerQueue, \
    GridKeyIndex
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.branch.BranchTuple import \
    BranchTuple
from sqlalchemy import select
from vortex.Tuple import Tuple

logger = logging.getLogger(__name__)


def _deleteBranchDisps(conn, branchIds: List[int]) -> None:
    """ Queue Grids for Removed Branch Disps

    This method queues grids for compile that contain disps that are removed.

    NOTE: The branches will be removed by a cascading constraint, we only have
    to queue the grids for recompile.

    """

    dispBaseTable = DispBase.__table__
    gridKeyIndexTable = GridKeyIndex.__table__

    queueTable = GridKeyCompilerQueue.__table__

    results = conn.execute(
        select(distinct=True,
               columns=[gridKeyIndexTable.c.gridKey, gridKeyIndexTable.c.coordSetId],
               whereclause=dispBaseTable.c.branchId.in_(branchIds))
            .select_from(gridKeyIndexTable.join(dispBaseTable))
    ).fetchall()

    if results:
        conn.execute(
            queueTable.insert(),
            [dict(coordSetId=item.coordSetId, gridKey=item.gridKey) for item in results]
        )

    # Delete existing Disps

    conn.execute(
        dispBaseTable.delete(dispBaseTable.c.branchId.in_(branchIds))
    )


def _insertBranchDisps(ormSession,
                       coordSet: ModelCoordSet,
                       newBranches: List[BranchTuple]) -> None:
    """ Insert Disps for Branch

    1) Insert new Disps
    2) Queue disps for recompile

    """
    startTime = datetime.now(pytz.utc)
    # Create state arrays
    newDisps = []
    dispIdsToCompile = []

    # Convert the branch disps into database disps
    for newBranch in newBranches:

        branchDisps = _convertJsonDispsToTuples(newBranch)

        if not branchDisps:
            continue

        # Create the map from the UI temp ID to the DB ID
        oldDispIdMap = {}

        # Set the IDs of the new Disps
        newIdGen = CeleryDbConn.prefetchDeclarativeIds(DispBase, len(branchDisps))
        for _, disp in branchDisps:
            oldDispId = disp.id
            disp.id = next(newIdGen)
            oldDispIdMap[oldDispId] = disp.id
            dispIdsToCompile.append(disp.id)

            newDisps.append(disp)

        # Update the group IDs
        for _, disp in branchDisps:
            if disp.groupId in oldDispIdMap:
                disp.groupId = oldDispIdMap[disp.groupId]

        # Update the jsonDisp stored in the branch
        for jsonDisp, disp in branchDisps:
            jsonDisp['id'] = disp.id
            jsonDisp['gi'] = disp.groupId


    # Bulk load the Disps
    ormSession.bulk_save_objects(newDisps, update_changed_only=False)

    # Queue the compiler
    DispCompilerQueueController.queueDispIdsToCompileWithSession(
        dispIdsToCompile, ormSession
    )

    # TODO: Something with the LiveDB links

    logger.debug("Inserted %s disps for %s branches in %s",
                 len(newDisps), len(newBranches),
                 (datetime.now(pytz.utc) - startTime))


def _convertJsonDispsToTuples(branchTuple: BranchTuple) -> List:
    """ Convert Json Disps to Tuples

     """
    disps: List = []
    for jsonDisp in branchTuple.disps:
        disp = Tuple.smallJsonDictToTuple(jsonDisp)
        disp.coordSetId = branchTuple.coordSetId
        disp.branchId = branchTuple.id
        if hasattr(disp, "geomJson"):
            disp.geomJson = json.dumps(disp.geomJson)
        disps.append((jsonDisp, disp))
    return disps
