import logging
import zlib
from _collections import defaultdict
from datetime import datetime
from typing import List, Dict

import pytz

from peek_plugin_base.storage.StorageUtil import makeCoreValuesSubqueryCondition, \
    makeOrmValuesSubqueryCondition
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispBase
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndexCompiled, \
    LocationIndex
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndexCompilerQueue
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from txcelery.defer import DeferrableTask

logger = logging.getLogger(__name__)

""" Location Index Compiler

Compile the location indexes

1) Query for queue
2) Process queue
3) Delete from queue
"""


@DeferrableTask
@celeryApp.task(bind=True)
def compileLocationIndex(self, queueItems) -> List[str]:
    """ Compile Location Index Task

    :param self: A celery reference to this task
    :param queueItems: An encoded payload containing the queue tuples.
    :returns: A list of grid keys that have been updated.
    """
    indexBuckets = list(set([i.indexBucket for i in queueItems]))
    modelSetIdByIndexBucket = {i.indexBucket: i.modelSetId for i in queueItems}

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
        dispData = _buildIndex(session, indexBuckets)

        conn.execute(compiledTable.delete(
            makeCoreValuesSubqueryCondition(engine, compiledTable.c.indexBucket,
                                            indexBuckets)
        ))
        transaction.commit()
        transaction = conn.begin()

        inserts = []
        for indexBucket, blobData in list(dispData.items()):
            inserts.append(dict(modelSetId=modelSetIdByIndexBucket[indexBucket],
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
        logger.debug("Compiled and Comitted %s LocationIndexCompileds in %s",
                     total, (datetime.utcnow() - startTime))

        return indexBuckets

    except Exception as e:
        transaction.rollback()
        logger.warning(e)  # Just a warning, it will retry
        raise self.retry(exc=e, countdown=10)

    finally:
        conn.close()
        session.close()


def _buildIndex(session, indexBuckets) -> Dict[str, str]:
    indexQry = (
        session.query(LocationIndex.indexBucket,
                      DispBase.id, DispBase.key, DispBase.locationJson)
            .join(DispBase, DispBase.id == LocationIndex.dispId)
            .filter(makeOrmValuesSubqueryCondition(
            session, LocationIndex.indexBucket, indexBuckets
        ))
    )

    jsonByIndexBucket = {}

    # Create the IndexBucket -> Key -> [Locations] structure
    locationByKeyByBucket = defaultdict(lambda: defaultdict(list))
    for item in indexQry:
        locationByKeyByBucket[item.indexBucket][item.key].append(item.locationJson)

    # Sort each bucket by the key
    for indexBucket, locationByKey in locationByKeyByBucket.items():

        # Create a list of of key, [locationJson, locationJson, locationJson]
        sortedKeyLocations = list(sorted(locationByKey.items(), key=lambda i: i[0]))

        # [even] is a key, [odd] is the locations json string
        indexStructure = []
        for key, locationsJson in sortedKeyLocations:
            indexStructure.append(key)

            # Combine the locations into one json array
            indexStructure.append('[' + ','.join(locationsJson) + ']')

        # Create the blob data for this index.
        # It will be searched by a binary sort
        dumpedJson = '[' + ','.join(indexStructure) + ']'
        blobData = zlib.compress(dumpedJson.encode(), 9)

        jsonByIndexBucket[indexBucket] = blobData

    return jsonByIndexBucket
