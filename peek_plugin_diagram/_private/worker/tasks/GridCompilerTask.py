from _collections import defaultdict
from collections import namedtuple

import hashlib
import logging
import pytz
from base64 import b64encode
from datetime import datetime
from functools import cmp_to_key
from txcelery.defer import DeferrableTask
from typing import List
from vortex.Payload import Payload

from peek_plugin_base.storage.StorageUtil import makeCoreValuesSubqueryCondition, \
    makeOrmValuesSubqueryCondition
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispLevel, DispBase, DispLayer
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndexCompiled, \
    GridKeyCompilerQueue, \
    GridKeyIndex
from peek_plugin_diagram._private.storage.branch.BranchGridIndex import BranchGridIndex
from peek_plugin_diagram._private.storage.branch.BranchIndex import BranchIndex
from peek_plugin_diagram._private.tuples.grid.GridTuple import GridTuple
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp

logger = logging.getLogger(__name__)

DispData = namedtuple('DispData', ['json', 'id', 'zOrder', 'levelOrder', 'layerOrder'])

""" Grid Compiler

Compile the disp items into the grid data

1) Query for queue
2) Process queue
3) Delete from queue
"""


@DeferrableTask
@celeryApp.task(bind=True)
def compileGrids(self, queueItems) -> List[str]:
    """ Compile Grids Task

    :param self: A celery reference to this task
    :param queueItems: An encoded payload containing the queue tuples.
    :returns: A list of grid keys that have been updated.
    """
    gridKeys = list(set([i.gridKey for i in queueItems]))
    coordSetIdByGridKey = {i.gridKey: i.coordSetId for i in queueItems}

    queueTable = GridKeyCompilerQueue.__table__
    gridTable = GridKeyIndexCompiled.__table__
    lastUpdate = datetime.now(pytz.utc).isoformat()

    startTime = datetime.now(pytz.utc)

    session = CeleryDbConn.getDbSession()
    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()
    try:

        logger.debug("Staring compile of %s queueItems in %s",
                     len(queueItems), (datetime.now(pytz.utc) - startTime))

        total = 0
        dispData = _qryDispData(session, gridKeys)
        branchData = _qryBranchData(session, gridKeys)

        conn.execute(gridTable.delete(
            makeCoreValuesSubqueryCondition(engine, gridTable.c.gridKey, gridKeys)
        ))
        transaction.commit()
        transaction = conn.begin()

        inserts = []
        for gridKey in gridKeys:
            dispJsonStr = dispData.get(gridKey)
            branchJsonStr = branchData.get(gridKey)

            m = hashlib.sha256()
            m.update(gridKey.encode())
            if dispJsonStr: m.update(dispJsonStr.encode())
            if branchJsonStr: m.update(branchJsonStr.encode())
            gridTupleHash = b64encode(m.digest()).decode()

            gridTuple = GridTuple(
                gridKey=gridKey,
                dispJsonStr=dispJsonStr,
                branchJsonStr=branchJsonStr,
                lastUpdate=gridTupleHash
            )

            encodedGridTuple = Payload(tuples=[gridTuple]).toEncodedPayload()

            inserts.append(dict(coordSetId=coordSetIdByGridKey[gridKey],
                                gridKey=gridKey,
                                lastUpdate=gridTupleHash,
                                encodedGridTuple=encodedGridTuple))

        if inserts:
            conn.execute(gridTable.insert(), inserts)

        logger.debug("Compiled %s gridKeys, %s missing, in %s",
                     len(inserts),
                     len(gridKeys) - len(inserts), (datetime.now(pytz.utc) - startTime))

        total += len(inserts)

        queueItemIds = [o.id for o in queueItems]
        conn.execute(queueTable.delete(
            makeCoreValuesSubqueryCondition(engine, queueTable.c.id, queueItemIds)
        ))

        transaction.commit()
        logger.debug("Compiled and Comitted %s GridKeyIndexCompileds in %s",
                     total, (datetime.now(pytz.utc) - startTime))

        return gridKeys

    except Exception as e:
        transaction.rollback()
        logger.warning(e)  # Just a warning, it will retry
        raise self.retry(exc=e, countdown=10)

    finally:
        conn.close()
        session.close()


def _dispBaseSortCmp(dispData1, dispData2):
    levelDiff = dispData1.levelOrder - dispData2.levelOrder
    if levelDiff != 0:
        return levelDiff

    layerDiff = dispData1.layerOrder - dispData2.layerOrder
    if layerDiff != 0:
        return layerDiff

    return dispData1.zOrder - dispData2.zOrder


def _qryDispData(session, gridKeys):
    indexQry = (
        session.query(GridKeyIndex.gridKey, DispBase.dispJson,
                      DispBase.id, DispBase.zOrder,
                      DispLevel.order, DispLayer.order)
            .join(DispBase, DispBase.id == GridKeyIndex.dispId)
            .join(DispLevel)
            .join(DispLayer)
            .filter(makeOrmValuesSubqueryCondition(
            session, GridKeyIndex.gridKey, gridKeys
        ))
    )

    dispsByGridKeys = defaultdict(list)

    for item in indexQry:
        dispsByGridKeys[item[0]].append(DispData(*item[1:]))

    for gridKey, dispDatas in list(dispsByGridKeys.items()):
        dispsDumpedJson = [d.json
                           for d in sorted(dispDatas,
                                           key=cmp_to_key(_dispBaseSortCmp))
                           if d.json]

        dispsByGridKeys[gridKey] = '[' + ','.join(dispsDumpedJson) + ']'

    return dispsByGridKeys


def _qryBranchData(session, gridKeys):
    indexQry = (
        session.query(BranchIndex.gridKey, BranchIndex.packedJson, BranchIndex.key)
            .join(BranchIndex, BranchIndex.id == BranchGridIndex.branchIndexId)
            .filter(makeOrmValuesSubqueryCondition(
            session, BranchGridIndex.gridKey, gridKeys
        ))
    )

    branchesByGridKeys = defaultdict(list)

    for item in indexQry:
        branchesByGridKeys[item[0]].append(item[1])

    for gridKey, branchJsons in list(branchesByGridKeys.items()):
        branchesByGridKeys[gridKey] = '[' + ','.join(branchJsons) + ']'

    return branchesByGridKeys
