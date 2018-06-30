import json
import logging
from _collections import defaultdict
from datetime import datetime

import pytz
from collections import namedtuple
from sqlalchemy.orm import subqueryload
from sqlalchemy.sql.selectable import Select

from peek_plugin_base.storage.StorageUtil import makeCoreValuesSubqueryCondition, \
    makeOrmValuesSubqueryCondition
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispBase, DispText, \
    DispTextStyle
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex, \
    DispIndexerQueue, GridKeyCompilerQueue
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndex, \
    LocationIndexCompilerQueue
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks._CalcDisp import _scaleDispGeom
from peek_plugin_diagram._private.worker.tasks._CalcDispFromLiveDb import \
    _mergeInLiveDbValues
from peek_plugin_diagram._private.worker.tasks._CalcGrid import makeGridKeys
from peek_plugin_diagram._private.worker.tasks._CalcLocation import makeLocationJson, \
    dispKeyHashBucket
from peek_plugin_livedb.worker.WorkerApi import WorkerApi
from txcelery.defer import DeferrableTask

logger = logging.getLogger(__name__)

CoordSetIdGridKeyData = namedtuple("CoordSetIdGridKeyTuple",
                                   ["coordSetId", "gridKey"])

ModelSetIdIndexBucketData = namedtuple("ModelSetIdIndexBucketTuple",
                                       ["modelSetId", "indexBucket"])

DispData = namedtuple('DispData', ['json', 'levelOrder', 'layerOrder'])


@DeferrableTask
@celeryApp.task(bind=True)
def compileDisps(self, queueIds, dispIds):
    startTime = datetime.now(pytz.utc)

    dispBaseTable = DispBase.__table__
    dispQueueTable = DispIndexerQueue.__table__

    gridKeyIndexTable = GridKeyIndex.__table__
    gridQueueTable = GridKeyCompilerQueue.__table__

    locationIndexTable = LocationIndex.__table__
    locationIndexCompilerQueueTable = LocationIndexCompilerQueue.__table__

    # ---------------
    # inserts for GridKeyCompilerQueue
    locationCompiledQueueItems = set()

    # List of location index bucket to disp index items to insert into PrivateDiagramLocationLoaderService
    locationIndexByDispId = {}

    # ---------------
    # inserts for GridKeyCompilerQueue
    gridCompiledQueueItems = set()

    # GridKeyIndexes to insert
    gridKeyIndexesByDispId = defaultdict(list)

    ormSession = CeleryDbConn.getDbSession()
    try:

        coordSets = (ormSession.query(ModelCoordSet)
                     .options(subqueryload(ModelCoordSet.modelSet),
                              subqueryload(ModelCoordSet.gridSizes))
                     .all())

        # Get Model Set Name Map
        coordSetById = {o.id: o for o in coordSets}

        # Get Model Set Name Map
        textStyleById = {ts.id: ts for ts in ormSession.query(DispTextStyle).all()}

        # -----
        # Begin the DISP merge from live data
        dispsQry = (ormSession.query(DispBase)
            .options(subqueryload(DispBase.liveDbLinks),
                     subqueryload(DispBase.level))
            .filter(
            makeOrmValuesSubqueryCondition(ormSession, DispBase.id, dispIds))
        )

        # print dispsQry
        dispsAll = dispsQry.all()

        liveDbKeysByModelSetKey = defaultdict(list)
        for disp in dispsQry:
            # Add a reference to the model set name for convininece
            disp.modelSetKey = coordSetById[disp.coordSetId].modelSet.name
            liveDbKeysByModelSetKey[disp.modelSetKey].extend(
                [dl.liveDbKey for dl in disp.liveDbLinks]
            )

        liveDbItemByModelSetKeyByKey = {}
        for modelSetKey, liveDbKeys in liveDbKeysByModelSetKey.items():
            liveDbItemByModelSetKeyByKey[modelSetKey] = {
                i.key: i for i in
                WorkerApi.getLiveDbDisplayValues(ormSession, modelSetKey, liveDbKeys)
            }

        logger.debug("Loaded %s disp objects in %s",
                     len(dispsAll), (datetime.now(pytz.utc) - startTime))

        for disp in dispsQry:

            liveDbItemByKey = liveDbItemByModelSetKeyByKey[disp.modelSetKey]
            # Apply live db links
            _mergeInLiveDbValues(disp, liveDbItemByKey)

            # If this is a text disp, and there is no text, don't include it
            if isinstance(disp, DispText) and not disp.text:
                continue

            # Get a reference to the coordSet
            coordSet = coordSetById[disp.coordSetId]

            # Get the geomJson as structured data
            geomJson = json.loads(disp.geomJson)

            geomJson = _scaleDispGeom(geomJson, coordSet)

            # Populate the grid
            jsonDict = disp.tupleToSmallJsonDict()
            jsonDict["g"] = geomJson
            disp.dispJson = json.dumps(jsonDict)

            # Populate the location json
            disp.locationJson = None
            if disp.key:
                # Create the location json for the PrivateDiagramLocationLoaderService
                disp.locationJson = makeLocationJson(disp, geomJson)

                # Create the index bucket
                indexBucket = dispKeyHashBucket(coordSet.modelSet.name, disp.key)

                # Create the compiler queue item
                locationCompiledQueueItems.add(
                    ModelSetIdIndexBucketData(modelSetId=coordSet.modelSetId,
                                              indexBucket=indexBucket)
                )

                # Create the location index item
                locationIndexByDispId[disp.id] = dict(
                    indexBucket=indexBucket,
                    dispId=disp.id,
                    modelSetId=coordSet.modelSetId
                )

            # Work out which grids we belong to
            for gridKey in makeGridKeys(coordSet, disp, geomJson, textStyleById):
                # Create the compiler queue item
                gridCompiledQueueItems.add(
                    CoordSetIdGridKeyData(coordSetId=disp.coordSetId,
                                          gridKey=gridKey)
                )

                # Create the grid key index item
                gridKeyIndexesByDispId[disp.id].append(
                    dict(dispId=disp.id,
                         coordSetId=disp.coordSetId,
                         gridKey=gridKey,
                         importGroupHash=disp.importGroupHash))

        logger.debug("Updated %s disp objects in %s",
                     len(dispsAll), (datetime.now(pytz.utc) - startTime))

        ormSession.commit()
        logger.debug("Committed %s disp objects in %s",
                     len(dispsAll), (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        ormSession.rollback()
        logger.exception(e)
        # logger.warning(e)
        raise self.retry(exc=e, countdown=10)

    finally:
        ormSession.close()

    # -----
    # Begin the GridKeyIndex updates

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()
    try:
        lockedDispIds = conn.execute(Select(
            whereclause=
            makeCoreValuesSubqueryCondition(engine, dispBaseTable.c.id, dispIds),
            columns=[dispBaseTable.c.id],
            for_update=True))

        lockedDispIds = [o[0] for o in lockedDispIds]

        # Ensure that the Disps exist, otherwise we get an integrity error.
        gridKeyIndexes = []
        locationIndexes = []
        for dispId in lockedDispIds:
            gridKeyIndexes.extend(gridKeyIndexesByDispId[dispId])

            if dispId in locationIndexByDispId:
                locationIndexes.append(locationIndexByDispId[dispId])

        # Delete existing items in the location and grid index

        # grid index
        conn.execute(gridKeyIndexTable.delete(
            makeCoreValuesSubqueryCondition(engine, gridKeyIndexTable.c.dispId, dispIds)
        ))

        # location index
        conn.execute(locationIndexTable.delete(
            makeCoreValuesSubqueryCondition(engine, locationIndexTable.c.dispId, dispIds)
        ))

        # ---------------
        # Insert the Grid Key indexes
        if gridKeyIndexes:
            conn.execute(gridKeyIndexTable.insert(), gridKeyIndexes)

        # Directly insert into the Grid compiler queue.
        if gridCompiledQueueItems:
            conn.execute(
                gridQueueTable.insert(),
                [dict(coordSetId=i.coordSetId, gridKey=i.gridKey)
                 for i in gridCompiledQueueItems]
            )

        # ---------------
        # Insert the Location indexes
        if locationIndexes:
            conn.execute(locationIndexTable.insert(), locationIndexes)

        # Directly insert into the Location compiler queue.
        if locationCompiledQueueItems:
            conn.execute(
                locationIndexCompilerQueueTable.insert(),
                [dict(modelSetId=i.modelSetId, indexBucket=i.indexBucket)
                 for i in locationCompiledQueueItems]
            )

        # ---------------
        # Finally, delete the disp queue items

        conn.execute(dispQueueTable.delete(
            makeCoreValuesSubqueryCondition(engine, dispQueueTable.c.id, queueIds)
        ))

        transaction.commit()
        logger.debug("Committed %s GridKeyIndex in %s",
                     len(gridKeyIndexes), (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        transaction.rollback()
        logger.exception(e)
        # logger.warning(e)
        raise self.retry(exc=e, countdown=10)

    finally:
        conn.close()
