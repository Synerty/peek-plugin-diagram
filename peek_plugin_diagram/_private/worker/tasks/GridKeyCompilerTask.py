import logging
import zlib
from _collections import defaultdict
from datetime import datetime
from typing import List

from collections import namedtuple
from functools import cmp_to_key
from txcelery.defer import DeferrableTask

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispLevel, DispBase, DispLayer
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndexCompiled, \
    GridKeyCompilerQueue, \
    GridKeyIndex
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp

logger = logging.getLogger(__name__)

DispData = namedtuple('DispData', ['json', 'id', 'levelOrder', 'layerOrder'])

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
    lastUpdate = datetime.utcnow()

    startTime = datetime.utcnow()

    session = CeleryDbConn.getDbSession()
    conn = CeleryDbConn.getDbEngine().connect()
    transaction = conn.begin()
    try:

        logger.debug("Staring compile of %s queueItems in %s",
                     len(queueItems), (datetime.utcnow() - startTime))

        total = 0
        dispData = _qryDispData(session, gridKeys)

        conn.execute(gridTable.delete(gridTable.c.gridKey.in_(gridKeys)))
        transaction.commit()
        transaction = conn.begin()

        inserts = []
        for gridKey, blobData in list(dispData.items()):
            inserts.append(dict(coordSetId=coordSetIdByGridKey[gridKey],
                                gridKey=gridKey,
                                lastUpdate=lastUpdate,
                                blobData=blobData))

        if inserts:
            conn.execute(gridTable.insert(), inserts)

        logger.debug("Compiled %s gridKeys, %s missing, in %s",
                     len(inserts),
                     len(gridKeys) - len(inserts), (datetime.utcnow() - startTime))

        total += len(inserts)

        conn.execute(
            queueTable.delete(queueTable.c.id.in_([o.id for o in queueItems]))
        )

        transaction.commit()
        logger.debug("Compiled and Comitted %s GridKeyIndexCompileds in %s",
                     total, (datetime.utcnow() - startTime))

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

    return dispData1.id - dispData2.id


def _qryDispData(session, gridKeys):
    indexQry = (session.query(GridKeyIndex.gridKey, DispBase.dispJson,
                              DispBase.id,
                              DispLevel.order, DispLayer.order)
                .join(DispBase, DispBase.id == GridKeyIndex.dispId)
                .join(DispLevel)
                .join(DispLayer)
                .filter(GridKeyIndex.gridKey.in_(gridKeys))
                )

    dispsByGridKeys = defaultdict(list)

    for item in indexQry:
        dispsByGridKeys[item[0]].append(DispData(*item[1:]))

    for gridKey, dispDatas in list(dispsByGridKeys.items()):
        dispsDumpedJson = [d.json
                           for d in sorted(dispDatas,
                                           key=cmp_to_key(_dispBaseSortCmp))
                           if d.json]

        dispsDumpedJson = '[' + ','.join(dispsDumpedJson) + ']'
        blobData = zlib.compress(dispsDumpedJson.encode(), 9)

        dispsByGridKeys[gridKey] = blobData

    return dispsByGridKeys
