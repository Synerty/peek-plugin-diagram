import logging
import zlib
from _collections import defaultdict
from collections import namedtuple
from datetime import datetime

from peek.core.orm.Display import DispLevel, DispBase, DispLayer
from peek.core.orm.GridKeyIndex import GridKeyIndexCompiled, GridKeyCompilerQueue, \
    GridKeyIndex
from proj.DbConnection import getSession, getEngine
from sqlalchemy.sql.expression import cast
from sqlalchemy.sql.sqltypes import String
from txcelery.defer import CeleryClient

from txhttputil import Payload

logger = logging.getLogger(__name__)

DispData = namedtuple('DispData', ['json', 'id', 'levelOrder', 'layerOrder'])

from proj.CeleryApp import app


class GridKeyQueueCompilerTask:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    def compileGrid(self, queueItems):
        gridKeys = list(set([i.gridKey for i in queueItems]))
        coordSetIdByGridKey = {i.gridKey: i.coordSetId for i in queueItems}

        queueTable = GridKeyCompilerQueue.__table__
        gridTable = GridKeyIndexCompiled.__table__
        lastUpdate = datetime.utcnow()

        startTime = datetime.utcnow()

        session = getSession()
        conn = getEngine().connect()
        transaction = conn.begin()

        logger.debug("Staring compile of %s queueItems in %s",
                     len(queueItems), (datetime.utcnow() - startTime))

        total = 0
        dispData = self._qryDispData(session, gridKeys)

        conn.execute(gridTable.delete(gridTable.c.gridKey.in_(gridKeys)))

        inserts = []
        for gridKey, blobData in list(dispData.items()):
            inserts.append(GridKeyIndexCompiled(coordSetId=coordSetIdByGridKey[gridKey],
                                                gridKey=gridKey,
                                                lastUpdate=lastUpdate,
                                                blobData=blobData))
        if inserts:
            conn.execute(gridTable.insert(),
                         [i.tupleToSqlaBulkInsertDict() for i in inserts])

        logger.debug("Compiled %s gridKeys, %s missing, in %s",
                     len(inserts),
                     len(gridKeys) - len(inserts), (datetime.utcnow() - startTime))

        total += len(inserts)

        # from peek_server.api.client.ClientGridHandler import clientGridHandler
        # clientGridHandler.addCacheNewGrids(inserts)

        conn.execute(
            queueTable.delete(queueTable.c.id.in_([o.id for o in queueItems]))
        )

        try:
            transaction.commit()
            logger.debug("Compiled and Comitted %s GridKeyIndexCompileds in %s",
                         total, (datetime.utcnow() - startTime))
        except Exception as e:
            transaction.rollback()
            logger.critical(e)

        conn.close()
        session.close()

    def _dispBaseSortCmp(self, dispData1, dispData2):
        levelDiff = dispData1.levelOrder - dispData2.levelOrder
        if levelDiff != 0:
            return levelDiff

        layerDiff = dispData1.layerOrder - dispData2.layerOrder
        if layerDiff != 0:
            return layerDiff

        return dispData1.id - dispData2.id

    def _qryDispData(self, session, gridKeys):
        indexQry = (session.query(GridKeyIndex.gridKey,
                                  cast(DispBase.dispJson, String),
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
                                               cmp=self._dispBaseSortCmp)
                               if d.json]

            dispsDumpedJson = '[' + ','.join(dispsDumpedJson) + ']'
            blobData = zlib.compress(dispsDumpedJson, 9)

            dispsByGridKeys[gridKey] = blobData

        return dispsByGridKeys


gridKeyQueueCompilerTask = GridKeyQueueCompilerTask()



@CeleryClient
@app.task(bind=True)
def compileGrids(self, queueItemsVortexMsg):
    queueItems = Payload().fromVortexMsg(queueItemsVortexMsg).tuples
    try:
        gridKeyQueueCompilerTask.compileGrid(queueItems)
    except Exception as e:
        raise self.retry(exc=e, countdown=2)