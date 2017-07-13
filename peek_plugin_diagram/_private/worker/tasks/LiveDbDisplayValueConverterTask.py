import logging
from datetime import datetime
from typing import List

from collections import namedtuple
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.LiveDbDisplayValueConverter import \
    LiveDbDisplayValueConverter
from peek_plugin_livedb.tuples.LiveDbDisplayValueUpdateTuple import \
    LiveDbDisplayValueUpdateTuple
from peek_plugin_livedb.tuples.LiveDbRawValueUpdateTuple import LiveDbRawValueUpdateTuple
from peek_plugin_livedb.worker.WorkerApi import WorkerApi
from txcelery.defer import CeleryClient

logger = logging.getLogger(__name__)

CoordSetIdGridKeyTuple = namedtuple("CoordSetIdGridKeyTuple", ["coordSetId", "gridKey"])
DispData = namedtuple('DispData', ['json', 'levelOrder', 'layerOrder'])


@CeleryClient
@celeryApp.task
def convertLiveDbDisplayValuesTask(modelSetName: str,
                                   rawUpdates: List[LiveDbRawValueUpdateTuple]):
    startTime = datetime.utcnow()
    keys = [u.key for u in rawUpdates]

    ormSession = CeleryDbConn.getDbSession()
    try:
        liveDbDataTypeLookup = WorkerApi.getLiveDbKeyDatatypeDict(
            ormSession, modelSetName, keys
        )

        modelSetId = (ormSession.query(ModelCoordSet.modelSetId)
                      .filter(ModelCoordSet.name == modelSetName)
                      .one()
                      .modelSetId)

        translater = LiveDbDisplayValueConverter.create(
            ormSession, modelSetId
        )

    finally:
        ormSession.close()

    displayValueUpdates: List[LiveDbDisplayValueUpdateTuple] = []

    for rawUpdate in rawUpdates:
        dataType = liveDbDataTypeLookup.get(rawUpdate.key)
        if dataType is None:
            logger.warning("LiveDB key %s is missing dataType", rawUpdate.key)
            continue

        displayValue = translater.translate(dataType, rawUpdate.rawValue)

        displayValueUpdates.append(LiveDbDisplayValueUpdateTuple(
            key=rawUpdate.key, displayValue=displayValue
        ))

    logger.debug("Converted %s LiveDB Raw Values in %s",
                 len(rawUpdates), (datetime.utcnow() - startTime))

    return displayValueUpdates
