import logging
import zlib
from _collections import defaultdict
from datetime import datetime
from typing import List

import pytz
from collections import namedtuple
from functools import cmp_to_key

from peek_plugin_base.storage.StorageUtil import makeCoreValuesSubqueryCondition, \
    makeOrmValuesSubqueryCondition
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndexCompilerQueue, \
    LocationIndexCompiled
from peek_plugin_diagram._private.storage.Display import DispLevel, DispBase, DispLayer
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndexCompiled, \
    GridKeyCompilerQueue, \
    GridKeyIndex
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from txcelery.defer import DeferrableTask

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
def compileLocationIndex(self, queueItems) -> List[str]:
    """ Compile Disp Grid Index Task

    :param self: A celery reference to this task
    :param queueItems: An encoded payload containing the queue tuples.
    :returns: A list of grid keys that have been updated.
    """
    indexBuckets = list(set([i.indexBucket for i in queueItems]))
    modelSetIdByGridKey = {i.indexBucket: i.modelSetId for i in queueItems}

    queueTable = LocationIndexCompilerQueue.__table__
    compiledTable = LocationIndexCompiled.__table__
    lastUpdate = datetime.now(pytz.utc).isoformat()

    startTime = datetime.utcnow()

    session = CeleryDbConn.getDbSession()
    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()
    try:

        logger.debug("Staring compile of %s queueItems in %s",
                     len(queueItems), (datetime.utcnow() - startTime))

        total = 0
        dispData = _qryDispData(session, indexBuckets)

        conn.execute(compiledTable.delete(
            makeCoreValuesSubqueryCondition(engine, compiledTable.c.indexBucket, indexBuckets)
        ))
        transaction.commit()
        transaction = conn.begin()

        inserts = []
        for indexBucket, blobData in list(dispData.items()):
            inserts.append(dict(modelSetId=modelSetIdByGridKey[indexBucket],
                                indexBucket=indexBucket,
                                lastUpdate=lastUpdate,
                                blobData=blobData))

        if inserts:
            conn.execute(compiledTable.insert(), inserts)

        logger.debug("Compiled %s LocationIndexes, %s missing, in %s",
                     len(inserts),
                     len(indexBuckets) - len(inserts), (datetime.utcnow() - startTime))

        total += len(inserts)

        queueItemIds = [o.id for o in queueItems]
        conn.execute(queueTable.delete(
            makeCoreValuesSubqueryCondition(engine, queueTable.c.id, queueItemIds)
        ))

        transaction.commit()
        logger.debug("Compiled and Comitted %s GridKeyIndexCompileds in %s",
                     total, (datetime.utcnow() - startTime))

        return indexBuckets

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


def _qryDispData(session, indexBuckets):
    indexQry = (
        session.query(GridKeyIndex.indexBucket, DispBase.dispJson,
                      DispBase.id,
                      DispLevel.order, DispLayer.order)
            .join(DispBase, DispBase.id == GridKeyIndex.dispId)
            .join(DispLevel)
            .join(DispLayer)
            .filter(makeOrmValuesSubqueryCondition(
            session, GridKeyIndex.indexBucket, indexBuckets
        ))
    )

    dispsByGridKeys = defaultdict(list)

    for item in indexQry:
        dispsByGridKeys[item[0]].append(DispData(*item[1:]))

    for indexBucket, dispDatas in list(dispsByGridKeys.items()):
        dispsDumpedJson = [d.json
                           for d in sorted(dispDatas, key=cmp_to_key(_dispBaseSortCmp))
                           if d.json]

        dispsDumpedJson = '[' + ','.join(dispsDumpedJson) + ']'
        blobData = zlib.compress(dispsDumpedJson.encode(), 9)

        dispsByGridKeys[indexBucket] = blobData

    return dispsByGridKeys

