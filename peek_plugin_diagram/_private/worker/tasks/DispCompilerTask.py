import json
import logging
import math
from _collections import defaultdict
from datetime import datetime
from typing import Dict, List

from collections import namedtuple
from sqlalchemy.orm import subqueryload
from sqlalchemy.sql.selectable import Select
from txcelery.defer import CeleryClient

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.GridKeyUtil import GRID_SIZES, makeGridKey
from peek_plugin_diagram._private.storage.Display import DispBase, DispText
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    DispIndexerQueue as DispIndexerQueueTable
from peek_plugin_diagram._private.storage.GridKeyIndex import \
    GridKeyCompilerQueue as GridKeyCompilerQueueTable
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex, \
    DispIndexerQueue
from peek_plugin_diagram._private.storage.LiveDbDispLink import \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet, ModelSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from peek_plugin_livedb.worker.WorkerApi import WorkerApi

logger = logging.getLogger(__name__)

CoordSetIdGridKeyTuple = namedtuple("CoordSetIdGridKeyTuple", ["coordSetId", "gridKey"])
DispData = namedtuple('DispData', ['json', 'levelOrder', 'layerOrder'])


@CeleryClient
@celeryApp.task()
def compileDisps(lastQueueId, queueDispIds):
    startTime = datetime.utcnow()

    dispBaseTable = DispBase.__table__
    gridQueueTable = DispIndexerQueue.__table__
    gridTable = GridKeyIndex.__table__
    dispQueueTable = DispIndexerQueueTable.__table__

    ormSession = CeleryDbConn.getDbSession()
    conn = CeleryDbConn.getDbEngine().connect()
    try:

        # Get Model Set Name Map
        modelSetNameByCoordId = {o[0]: o[1] for o in
                                 ormSession.query(ModelCoordSet.id,
                                                  ModelSet.name).all()}

        # -----
        # Begin the DISP merge from live data
        dispsQry = (ormSession.query(DispBase)
                    .options(subqueryload(DispBase.liveDbLinks),
                             subqueryload(DispBase.level))
                    .filter(DispBase.id.in_(queueDispIds)))

        # print dispsQry
        dispsAll = dispsQry.all()

        liveDbKeysByModelSetName = defaultdict(list)
        for disp in dispsQry:
            # Add a reference to the model set name for convininece
            disp.modelSetName = modelSetNameByCoordId[disp.coordSetId]
            liveDbKeysByModelSetName[disp.modelSetName].extend(
                [dl.liveDbKey for dl in disp.liveDbLinks]
            )

        liveDbItemByModelSetNameByKey = {}
        for modelSetName, liveDbKeys in liveDbKeysByModelSetName.items():
            liveDbItemByModelSetNameByKey[modelSetName] = {
                i.key: i for i in
                WorkerApi.getLiveDbDisplayValues(ormSession, modelSetName, liveDbKeys)
            }

        logger.debug("Loaded %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        # List of type CoordSetIdGridKeyTuple
        gridCompiledQueueItems = set()

        # GridKeyIndexes to insert
        gridKeyIndexesByDispId = defaultdict(list)

        for disp in dispsQry:
            liveDbItemByKey = liveDbItemByModelSetNameByKey[disp.modelSetName]
            # Apply live db links
            _mergeInLiveDbValues(disp, liveDbItemByKey)

            # Deflate to json
            jsonDict = disp.tupleToSmallJsonDict()
            jsonDict["g"] = json.loads(disp.geomJson)
            disp.dispJson = json.dumps(jsonDict)

            for gridKey in makeGridKeys(disp):
                gridCompiledQueueItems.add(
                    CoordSetIdGridKeyTuple(coordSetId=disp.coordSetId,
                                           gridKey=gridKey)
                )

                gridKeyIndexesByDispId[disp.id].append(
                    dict(dispId=disp.id,
                         coordSetId=disp.coordSetId,
                         gridKey=gridKey,
                         importGroupHash=disp.importGroupHash))

        logger.debug("Updated %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        ormSession.commit()
        logger.debug("Committed %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

    except Exception as e:
        ormSession.rollback()
        logger.exception(e)
        raise

    finally:
        ormSession.close()

    # -----
    # Begin the GridKeyIndex updates

    transaction = conn.begin()
    try:
        lockedDispIds = conn.execute(Select(
            whereclause=dispBaseTable.c.id.in_(queueDispIds),
            columns=[dispBaseTable.c.id],
            for_update=True))

        # Ensure that the Disps exist, otherwise we get an integrity error.
        gridKeyIndexes = []
        for dispId, in lockedDispIds:
            gridKeyIndexes.extend(gridKeyIndexesByDispId[dispId])

        conn.execute(gridTable.delete(gridTable.c.dispId.in_(queueDispIds)))
        if gridKeyIndexes:
            conn.execute(gridTable.insert(), gridKeyIndexes)
        conn.execute(gridQueueTable.delete(gridQueueTable.c.id <= lastQueueId))

        # ---------------
        # Directly insert into the Grid compiler queue.
        if gridCompiledQueueItems:
            conn.execute(
                GridKeyCompilerQueueTable.__table__.insert(),
                [dict(coordSetId=i.coordSetId, gridKey=i.gridKey)
                 for i in gridCompiledQueueItems]
            )

        # ---------------
        # Finally, delete the disp queue items

        conn.execute(dispQueueTable.delete(dispQueueTable.c.id.in_(queueDispIds)))

        transaction.commit()
        logger.debug("Committed %s GridKeyIndex in %s",
                     len(gridKeyIndexes), (datetime.utcnow() - startTime))

    except Exception as e:
        transaction.rollback()
        logger.exception(e)
        raise

    finally:
        conn.close()


def _mergeInLiveDbValues(disp, liveDbItemByKey):
    for dispLink in disp.liveDbLinks:
        liveDbItem = liveDbItemByKey.get(dispLink.liveDbKey)
        if liveDbItem:
            _mergeInLiveDbValue(disp, dispLink, liveDbItem)


def _mergeInLiveDbValue(disp, dispLink, liveDbItem, value=None):
    # This allows us to change the value and use recursion a little
    # (Value is converted to different data types and recursively called, see below)
    if value is None:
        value = liveDbItem.displayValue

    # At least for colors :
    # If the color vale is None, set the attribute to None as well
    # At this stage we don't expect other data types to be None
    if value is None:
        keyType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]
        assert keyType == ImportLiveDbItemTuple.DATA_TYPE_COLOR
        setattr(disp, dispLink.dispAttrName, None)
        return

    # ----------------------------
    # Not text
    if not (isinstance(disp, DispText) and dispLink.dispAttrName == "text"):
        setattr(disp, dispLink.dispAttrName, value)
        return

        # ----------------------------
    # Special case for Text

    # If there is no format, then just use the value
    if not disp.textFormat:
        disp.text = value
        return

    _applyTextFormat(disp, dispLink, liveDbItem, value)


def _applyTextFormat(disp, dispLink, liveDbItem, value):
    # If there is a format, then convert it.
    try:
        disp.text = (disp.textFormat % value)

    except TypeError as e:
        message = str(e)
        # Lazy format type detection
        try:
            if "number is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "invalid literal for int" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "an integer is required, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "float is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "must be real number, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "could not convert string to float" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

        except ValueError as e:
            # We can't convert the value to int/float
            # Ignore the formatting, it will come good when the value does
            logger.debug("Failed to format |%s| value |%s| to |%s|",
                         liveDbItem.key, value, disp.textFormat)
            disp.text = ""

        logger.warn("DispText %s textFormat=|%s| value=|%s| failed with %s\n"
                    "This can occur if the LiveDbItem.rawValue has not yet been updated",
                    disp.id, disp.textFormat, value, message)



def makeGridKeys(disp):
    if not hasattr(disp, "geomJson"):
        return []

    if disp.geomJson is None:
        logger.critical(disp)

    points = json.loads(disp.geomJson)

    gridKeys = []
    for gridSize in list(GRID_SIZES.values()):
        # CHECK Declutter
        if 0.0 > (min(gridSize.max, (disp.level.maxZoom - 0.00001))
                      - max(gridSize.min, disp.level.minZoom)):
            continue

        # If this is just a point shape/geom, then add it and continue
        if len(points) == 1:
            point = points[0]
            gridKeys.append(makeGridKey(disp.coordSetId,
                                        gridSize,
                                        int(point['x'] / gridSize.xGrid),
                                        int(point['y'] / gridSize.yGrid)))
            continue

        # Else, All other shapes



        # Get the bounding box
        minx, miny, maxx, maxy = _calcBounds(points)

        # If the size is too small to see at the max zoom, then skip it
        size = math.hypot(maxx - minx, maxy - miny)
        largestSize = size * gridSize.max
        if largestSize < 2.0:
            continue

        # Round the grid X min/max
        minGridX = int(minx / gridSize.xGrid)
        maxGridX = int(maxx / gridSize.xGrid) + 1

        # Round the grid Y min/max
        minGridY = int(miny / gridSize.yGrid)
        maxGridY = int(maxy / gridSize.yGrid) + 1

        # Iterate through and create the grids.
        for gridX in range(minGridX, maxGridX):
            for gridY in range(minGridY, maxGridY):
                gridKeys.append(makeGridKey(disp.coordSetId, gridSize, gridX, gridY))

    return gridKeys


def _calcBounds(points: List[Dict[str, float]]):
    minx = None
    maxx = None
    miny = None
    maxy = None

    for point in points:
        x, y = point["x"], point["y"]
        if minx is None or x < minx:
            minx = x

        if maxx is None or maxx < x:
            maxx = x

        if miny is None or y < miny:
            miny = y

        if maxy is None or maxy < y:
            maxy = y

    return minx, miny, maxx, maxy
